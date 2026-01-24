import { prisma } from '@/lib/prisma';
import { TweetCategory, AccountType } from '@prisma/client';
import OpenAI from 'openai';
import { addKnowledgeItem } from './embeddings';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface TwitterApiTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count?: number;
  };
  entities?: {
    urls?: { expanded_url: string }[];
    mentions?: { username: string }[];
    hashtags?: { tag: string }[];
  };
  attachments?: {
    media_keys?: string[];
  };
  referenced_tweets?: { type: string; id: string }[];
  conversation_id?: string;
}

interface TwitterApiUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
}

interface TwitterApiResponse {
  data?: TwitterApiTweet[];
  includes?: {
    users?: TwitterApiUser[];
    media?: { media_key: string; url?: string; preview_image_url?: string }[];
  };
  meta?: {
    next_token?: string;
    result_count?: number;
  };
}

export async function fetchUserProfile(username: string): Promise<TwitterApiUser | null> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) return null;

  const userResponse = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
    { headers: { Authorization: `Bearer ${bearerToken}` } }
  );

  if (!userResponse.ok) return null;
  
  const userData = await userResponse.json();
  return userData.data || null;
}

export async function fetchTweetsForAccount(
  username: string,
  maxResults = 10
): Promise<{ tweets: TwitterApiTweet[]; user: TwitterApiUser | null }> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('TWITTER_BEARER_TOKEN not configured');
  }

  const userResponse = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
    {
      headers: { Authorization: `Bearer ${bearerToken}` },
    }
  );

  if (!userResponse.ok) {
    const error = await userResponse.text();
    throw new Error(`Failed to fetch user ${username}: ${error}`);
  }

  const userData = await userResponse.json();
  const user: TwitterApiUser | null = userData.data || null;
  const userId = user?.id;

  if (!userId) {
    throw new Error(`User not found: ${username}`);
  }

  const tweetsResponse = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?` +
      new URLSearchParams({
        max_results: maxResults.toString(),
        'tweet.fields': 'created_at,public_metrics,entities,attachments,referenced_tweets,conversation_id',
        expansions: 'attachments.media_keys',
        'media.fields': 'url,preview_image_url',
      }),
    {
      headers: { Authorization: `Bearer ${bearerToken}` },
    }
  );

  if (!tweetsResponse.ok) {
    const error = await tweetsResponse.text();
    throw new Error(`Failed to fetch tweets for ${username}: ${error}`);
  }

  const tweetsData: TwitterApiResponse = await tweetsResponse.json();
  return { tweets: tweetsData.data || [], user };
}

export async function classifyTweet(text: string): Promise<{ category: TweetCategory; reason: string }> {
  const prompt = `Classify this tweet into exactly ONE category:

ANNOUNCEMENT - Product launches, partnerships, integrations, new features, official news
METRICS - TVL updates, volume stats, on-chain data, performance numbers
COMMENTARY - Opinions, market analysis, takes on crypto/DeFi trends
THREAD - Educational content, deep dives, tutorials (usually starts with "1/" or "🧵")
NOISE - Engagement bait, memes, giveaways, generic hype, off-topic

Tweet: "${text}"

Respond with JSON only: {"category": "CATEGORY_NAME", "reason": "brief explanation"}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 100,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const category = (result.category?.toUpperCase() as TweetCategory) || 'UNCATEGORIZED';
    
    const validCategories: TweetCategory[] = ['ANNOUNCEMENT', 'METRICS', 'COMMENTARY', 'THREAD', 'NOISE', 'UNCATEGORIZED'];
    if (!validCategories.includes(category)) {
      return { category: 'UNCATEGORIZED', reason: 'Invalid category returned' };
    }
    
    return { category, reason: result.reason || '' };
  } catch (error) {
    console.error('Classification error:', error);
    return { category: 'UNCATEGORIZED', reason: 'Classification failed' };
  }
}

export async function ingestTweetsForAccount(accountId: string): Promise<number> {
  const account = await prisma.twitterAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.isActive) {
    throw new Error('Account not found or inactive');
  }

  const { tweets, user } = await fetchTweetsForAccount(account.username);
  
  if (user?.profile_image_url) {
    const hdImageUrl = user.profile_image_url.replace('_normal', '_400x400');
    await prisma.twitterAccount.update({
      where: { id: accountId },
      data: { 
        profileImageUrl: hdImageUrl,
        twitterId: user.id,
      },
    });
  }
  
  let ingestedCount = 0;

  for (const tweet of tweets) {
    const existing = await prisma.tweet.findUnique({
      where: { tweetId: tweet.id },
    });

    if (existing) continue;

    const isReply = tweet.referenced_tweets?.some(r => r.type === 'replied_to');
    const isPartOfThread = tweet.conversation_id && tweet.conversation_id !== tweet.id;

    const { category, reason } = await classifyTweet(tweet.text);

    const newTweet = await prisma.tweet.create({
      data: {
        tweetId: tweet.id,
        accountId: account.id,
        text: tweet.text,
        category,
        categoryReason: reason,
        isThread: isPartOfThread || tweet.text.includes('🧵') || /^\d+[\/.]/.test(tweet.text),
        threadId: tweet.conversation_id,
        replyToId: tweet.referenced_tweets?.find(r => r.type === 'replied_to')?.id,
        likeCount: tweet.public_metrics?.like_count || 0,
        retweetCount: tweet.public_metrics?.retweet_count || 0,
        replyCount: tweet.public_metrics?.reply_count || 0,
        viewCount: tweet.public_metrics?.impression_count,
        urls: tweet.entities?.urls?.map(u => u.expanded_url) || [],
        mentions: tweet.entities?.mentions?.map(m => m.username) || [],
        hashtags: tweet.entities?.hashtags?.map(h => h.tag) || [],
        mediaUrls: [],
        publishedAt: new Date(tweet.created_at),
        classifiedAt: new Date(),
        isHidden: category === 'NOISE' || isReply,
      },
    });

    if (category !== 'NOISE' && !isReply) {
      try {
        const content = `[${account.displayName}] @${account.username}: ${tweet.text}`;
        await addKnowledgeItem({
          content,
          sourceType: 'tweet',
          sourceUrl: `https://twitter.com/${account.username}/status/${tweet.id}`,
          sourceId: tweet.id,
          author: account.username,
          category: category.toLowerCase(),
          importance: category === 'ANNOUNCEMENT' ? 0.8 : category === 'METRICS' ? 0.7 : 0.5,
          publishedAt: new Date(tweet.created_at),
        });
      } catch (e) {
        console.error('Failed to add tweet to knowledge store:', e);
      }
    }

    ingestedCount++;
  }

  await prisma.twitterAccount.update({
    where: { id: accountId },
    data: { lastFetchedAt: new Date() },
  });

  return ingestedCount;
}

export async function ingestAllAccounts(): Promise<{ total: number; byAccount: Record<string, number> }> {
  const accounts = await prisma.twitterAccount.findMany({
    where: { isActive: true },
  });

  const results: Record<string, number> = {};
  let total = 0;

  for (const account of accounts) {
    try {
      const count = await ingestTweetsForAccount(account.id);
      results[account.username] = count;
      total += count;
    } catch (error) {
      console.error(`Failed to ingest @${account.username}:`, error);
      results[account.username] = 0;
    }
  }

  return { total, byAccount: results };
}

export async function getFeedTweets(options: {
  category?: TweetCategory;
  limit?: number;
  offset?: number;
  includeHidden?: boolean;
}) {
  const { category, limit = 50, offset = 0, includeHidden = false } = options;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (!includeHidden) where.isHidden = false;

  const tweets = await prisma.tweet.findMany({
    where,
    include: {
      account: {
        include: {
          member: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: offset,
  });

  return tweets;
}

export const INITIAL_ACCOUNTS: {
  username: string;
  displayName: string;
  accountType: AccountType;
  personName?: string;
  personRole?: string;
  protocolName: string;
}[] = [
  { username: 'HypurrFi', displayName: 'HypurrFi', accountType: 'PROTOCOL', protocolName: 'HypurrFi' },
  { username: 'androolloyd', displayName: 'Androo Lloyd', accountType: 'FOUNDER', personName: 'Androo Lloyd', personRole: 'Co-founder/CEO', protocolName: 'HypurrFi' },
  { username: 'andyhyfi', displayName: 'Andy Boyan', accountType: 'TEAM', personName: 'Andy Boyan', personRole: 'Head of Growth', protocolName: 'HypurrFi' },
  { username: 'KurtG', displayName: 'Kurt G', accountType: 'TEAM', personName: 'Kurt G', personRole: 'Team', protocolName: 'HypurrFi' },
  { username: 'holdforscott', displayName: 'Scott', accountType: 'TEAM', personName: 'Scott', personRole: 'Team', protocolName: 'HypurrFi' },
  
  { username: 'ClearstarLabs', displayName: 'Clearstar Labs', accountType: 'PROTOCOL', protocolName: 'Clearstar Labs' },
  { username: 'Alacomm', displayName: 'Alexander Maly', accountType: 'FOUNDER', personName: 'Alexander Maly', personRole: 'Co-founder', protocolName: 'Clearstar Labs' },
  
  { username: 'eulerfinance', displayName: 'Euler Finance', accountType: 'PROTOCOL', protocolName: 'Euler Finance' },
  { username: 'euler_mab', displayName: 'Michael Bentley', accountType: 'FOUNDER', personName: 'Michael Bentley', personRole: 'Co-founder, former CEO', protocolName: 'Euler Finance' },
  { username: '0xJHan', displayName: 'Jonathan Han', accountType: 'FOUNDER', personName: 'Jonathan Han', personRole: 'CEO', protocolName: 'Euler Finance' },
  { username: 'gupta_kanv', displayName: 'Kanv Gupta', accountType: 'TEAM', personName: 'Kanv Gupta', personRole: 'Team', protocolName: 'Euler Finance' },
];

export async function seedTwitterAccounts(): Promise<number> {
  let created = 0;
  
  for (const account of INITIAL_ACCOUNTS) {
    const existing = await prisma.twitterAccount.findUnique({
      where: { username: account.username },
    });
    
    if (!existing) {
      await prisma.twitterAccount.create({
        data: {
          username: account.username,
          displayName: account.displayName,
          accountType: account.accountType,
          personName: account.personName,
          personRole: account.personRole,
        },
      });
      created++;
    }
  }
  
  return created;
}
