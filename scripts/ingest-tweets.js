require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

async function classifyTweet(text) {
  const prompt = `Classify this tweet into exactly ONE category:

ANNOUNCEMENT - Product launches, partnerships, integrations, new features, official news
METRICS - TVL updates, volume stats, on-chain data, performance numbers
COMMENTARY - Opinions, market analysis, takes on crypto/DeFi trends
THREAD - Educational content, deep dives, tutorials (usually starts with "1/" or "🧵")
NOISE - Engagement bait, memes, giveaways, generic hype, off-topic, replies

Tweet: "${text}"

Respond with JSON only: {"category": "CATEGORY_NAME", "reason": "brief explanation"}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 100,
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (e) {
    console.error('Classification error:', e.message);
    return { category: 'UNCATEGORIZED', reason: 'Failed' };
  }
}

async function fetchTweets(username) {
  const userRes = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  
  if (!userRes.ok) {
    const err = await userRes.text();
    throw new Error(`User fetch failed: ${err}`);
  }
  
  const userData = await userRes.json();
  const userId = userData.data?.id;
  if (!userId) throw new Error('No user ID');

  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?` +
    `max_results=10&tweet.fields=created_at,public_metrics,entities,referenced_tweets,conversation_id`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  
  if (!tweetsRes.ok) {
    const err = await tweetsRes.text();
    throw new Error(`Tweets fetch failed: ${err}`);
  }
  
  const tweetsData = await tweetsRes.json();
  return tweetsData.data || [];
}

async function ingestAccount(account) {
  console.log(`\n📥 @${account.username}`);
  
  try {
    const tweets = await fetchTweets(account.username);
    console.log(`   Found ${tweets.length} tweets`);
    
    let ingested = 0;
    for (const tweet of tweets) {
      const existing = await prisma.tweet.findUnique({
        where: { tweetId: tweet.id }
      });
      
      if (existing) {
        console.log(`   - Skip: ${tweet.id} (exists)`);
        continue;
      }
      
      const isReply = tweet.referenced_tweets?.some(r => r.type === 'replied_to');
      const { category, reason } = await classifyTweet(tweet.text);
      
      await prisma.tweet.create({
        data: {
          tweetId: tweet.id,
          accountId: account.id,
          text: tweet.text,
          category,
          categoryReason: reason,
          isThread: tweet.text.includes('🧵') || /^\d+[\/.]/.test(tweet.text),
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
        }
      });
      
      console.log(`   ✓ ${category}: "${tweet.text.slice(0, 50)}..."`);
      ingested++;
    }
    
    await prisma.twitterAccount.update({
      where: { id: account.id },
      data: { lastFetchedAt: new Date() }
    });
    
    return ingested;
  } catch (e) {
    console.error(`   ✗ Error: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log('🐦 Starting Twitter ingestion...\n');
  
  const accounts = await prisma.twitterAccount.findMany({
    where: { isActive: true }
  });
  
  console.log(`Found ${accounts.length} active accounts`);
  
  let total = 0;
  for (const account of accounts) {
    const count = await ingestAccount(account);
    total += count;
  }
  
  console.log(`\n✅ Done! Ingested ${total} new tweets.`);
  
  const stats = await prisma.tweet.groupBy({
    by: ['category'],
    _count: { id: true }
  });
  
  console.log('\nCategory breakdown:');
  stats.forEach(s => console.log(`  ${s.category}: ${s._count.id}`));
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
