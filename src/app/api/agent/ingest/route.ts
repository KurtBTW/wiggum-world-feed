import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ingestAllDeFiLlamaData } from '@/services/defillama';
import { prisma } from '@/lib/prisma';
import { addKnowledgeItemsBatch } from '@/services/embeddings';

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
  const { source } = body;

  try {
    const results: Record<string, unknown> = {};

    if (!source || source === 'defillama') {
      const defillamaResults = await ingestAllDeFiLlamaData();
      results.defillama = defillamaResults;
    }

    if (!source || source === 'tweets') {
      const newTweets = await prisma.tweet.findMany({
        where: {
          category: { not: 'NOISE' },
          isHidden: false,
        },
        include: {
          account: {
            include: { member: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      });

      const existingSourceIds = await prisma.knowledgeItem.findMany({
        where: { sourceType: 'tweet' },
        select: { sourceId: true },
      });
      const existingSet = new Set(existingSourceIds.map(e => e.sourceId));

      const tweetsToAdd = newTweets
        .filter(t => !existingSet.has(t.tweetId))
        .map(tweet => ({
          content: `[${tweet.account.displayName}] @${tweet.account.username}: ${tweet.text}`,
          sourceType: 'tweet',
          sourceUrl: `https://twitter.com/${tweet.account.username}/status/${tweet.tweetId}`,
          sourceId: tweet.tweetId,
          author: tweet.account.username,
          category: tweet.category.toLowerCase(),
          importance: tweet.category === 'ANNOUNCEMENT' ? 0.8 : tweet.category === 'METRICS' ? 0.7 : 0.5,
          publishedAt: tweet.publishedAt,
        }));

      if (tweetsToAdd.length > 0) {
        const added = await addKnowledgeItemsBatch(tweetsToAdd);
        results.tweets = { added, total: tweetsToAdd.length };
      } else {
        results.tweets = { added: 0, total: 0, message: 'All tweets already indexed' };
      }
    }

    const totalKnowledge = await prisma.knowledgeItem.count();
    results.totalKnowledgeItems = totalKnowledge;

    return NextResponse.json({
      success: true,
      results,
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

  const stats = await prisma.knowledgeItem.groupBy({
    by: ['sourceType'],
    _count: { id: true },
  });

  const total = await prisma.knowledgeItem.count();

  const recent = await prisma.knowledgeItem.findMany({
    orderBy: { ingestedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      content: true,
      sourceType: true,
      ingestedAt: true,
    },
  });

  return NextResponse.json({
    total,
    bySource: stats.reduce((acc, s) => ({ ...acc, [s.sourceType]: s._count.id }), {}),
    recent,
  });
}
