import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !hasRole(session.user.role, 'MEMBER')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const member = await prisma.networkMember.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        twitterAccounts: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            personName: true,
            personRole: true,
            accountType: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    const tweets = await prisma.tweet.findMany({
      where: {
        account: {
          memberId: member.id,
        },
        isHidden: false,
        category: { not: 'NOISE' },
      },
      include: {
        account: {
          select: {
            username: true,
            displayName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ member, tweets });
  } catch (error) {
    console.error('Fetch member error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}
