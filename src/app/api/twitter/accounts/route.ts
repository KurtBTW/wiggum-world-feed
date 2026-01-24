import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { seedTwitterAccounts } from '@/services/twitter';
import { AccountType } from '@prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.twitterAccount.findMany({
    include: {
      member: { select: { id: true, name: true, slug: true } },
      _count: { select: { tweets: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as { role?: string })?.role;
  
  if (!session || userRole !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  
  if (body.action === 'seed') {
    const created = await seedTwitterAccounts();
    return NextResponse.json({ message: `Seeded ${created} accounts` });
  }

  const { username, displayName, accountType, personName, personRole, memberId } = body;

  if (!username || !displayName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const existing = await prisma.twitterAccount.findUnique({
    where: { username },
  });

  if (existing) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  }

  const account = await prisma.twitterAccount.create({
    data: {
      username: username.replace('@', ''),
      displayName,
      accountType: accountType as AccountType || 'PROTOCOL',
      personName,
      personRole,
      memberId,
    },
  });

  return NextResponse.json({ account }, { status: 201 });
}
