import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ingestAllAccounts, ingestTweetsForAccount } from '@/services/twitter';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;

  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCron && (!session || userRole !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { accountId } = body;

  try {
    if (accountId) {
      const count = await ingestTweetsForAccount(accountId);
      return NextResponse.json({ 
        message: `Ingested ${count} tweets`,
        count,
      });
    }

    const results = await ingestAllAccounts();
    return NextResponse.json({
      message: `Ingested ${results.total} tweets`,
      ...results,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingest failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = await prisma.tweet.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  const lastIngest = await prisma.twitterAccount.findFirst({
    where: { lastFetchedAt: { not: null } },
    orderBy: { lastFetchedAt: 'desc' },
    select: { lastFetchedAt: true, username: true },
  });

  return NextResponse.json({
    stats: stats.reduce((acc, s) => ({ ...acc, [s.category]: s._count.id }), {}),
    lastIngest,
  });
}
