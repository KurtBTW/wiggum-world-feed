import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFeedTweets } from '@/services/twitter';
import { TweetCategory } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') as TweetCategory | null;
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const includeHidden = searchParams.get('includeHidden') === 'true';

  const tweets = await getFeedTweets({
    category: category || undefined,
    limit,
    offset,
    includeHidden,
  });

  const grouped = {
    ANNOUNCEMENT: tweets.filter(t => t.category === 'ANNOUNCEMENT'),
    METRICS: tweets.filter(t => t.category === 'METRICS'),
    COMMENTARY: tweets.filter(t => t.category === 'COMMENTARY'),
    THREAD: tweets.filter(t => t.category === 'THREAD'),
  };

  return NextResponse.json({ 
    tweets, 
    grouped,
    total: tweets.length,
  });
}
