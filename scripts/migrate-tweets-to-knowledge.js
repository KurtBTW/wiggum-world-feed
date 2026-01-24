require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbeddings(texts) {
  if (texts.length === 0) return [];
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  
  return response.data.map(d => d.embedding);
}

async function main() {
  console.log('Migrating tweets to knowledge store...\n');
  
  const tweets = await prisma.tweet.findMany({
    where: {
      category: { not: 'NOISE' },
      isHidden: false,
    },
    include: {
      account: {
        include: {
          member: true,
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  });
  
  console.log(`Found ${tweets.length} tweets to migrate\n`);
  
  const existingSourceIds = await prisma.knowledgeItem.findMany({
    where: { sourceType: 'tweet' },
    select: { sourceId: true },
  });
  const existingSet = new Set(existingSourceIds.map(e => e.sourceId));
  
  const newTweets = tweets.filter(t => !existingSet.has(t.tweetId));
  console.log(`${newTweets.length} new tweets to add\n`);
  
  if (newTweets.length === 0) {
    console.log('No new tweets to migrate!');
    return;
  }
  
  const batchSize = 20;
  let added = 0;
  
  for (let i = 0; i < newTweets.length; i += batchSize) {
    const batch = newTweets.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(newTweets.length / batchSize)}...`);
    
    const contents = batch.map(tweet => {
      const author = tweet.account.displayName || tweet.account.username;
      const protocol = tweet.account.member?.name || tweet.account.username;
      return `[${protocol}] @${tweet.account.username} (${author}): ${tweet.text}`;
    });
    
    const embeddings = await generateEmbeddings(contents);
    
    for (let j = 0; j < batch.length; j++) {
      const tweet = batch[j];
      const embedding = embeddings[j];
      
      try {
        const knowledgeItem = await prisma.knowledgeItem.create({
          data: {
            content: contents[j],
            sourceType: 'tweet',
            sourceUrl: `https://twitter.com/${tweet.account.username}/status/${tweet.tweetId}`,
            sourceId: tweet.tweetId,
            protocolSlug: tweet.account.member?.slug || null,
            author: tweet.account.username,
            category: tweet.category.toLowerCase(),
            importance: getImportance(tweet),
            publishedAt: tweet.publishedAt,
          },
        });
        
        const embeddingStr = `[${embedding.join(',')}]`;
        await prisma.$executeRawUnsafe(
          `UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2`,
          embeddingStr,
          knowledgeItem.id
        );
        
        added++;
      } catch (e) {
        console.error(`Error adding tweet ${tweet.tweetId}:`, e.message);
      }
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✓ Added ${added} tweets to knowledge store`);
}

function getImportance(tweet) {
  let importance = 0.5;
  
  if (tweet.category === 'ANNOUNCEMENT') importance += 0.3;
  if (tweet.category === 'METRICS') importance += 0.2;
  if (tweet.category === 'THREAD') importance += 0.1;
  
  if (tweet.likeCount > 100) importance += 0.1;
  if (tweet.retweetCount > 50) importance += 0.1;
  
  return Math.min(importance, 1);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
