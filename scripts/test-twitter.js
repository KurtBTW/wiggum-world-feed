require('dotenv').config();

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

async function testTwitterApi() {
  console.log('Testing Twitter API...\n');
  console.log('Bearer token:', BEARER_TOKEN ? `${BEARER_TOKEN.slice(0, 20)}...` : 'NOT SET');
  
  if (!BEARER_TOKEN) {
    console.error('TWITTER_BEARER_TOKEN not found in environment');
    process.exit(1);
  }

  const username = 'HypurrFi';
  
  console.log(`\nFetching user: @${username}`);
  const userRes = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  
  console.log('User response status:', userRes.status);
  const userData = await userRes.json();
  
  if (!userRes.ok) {
    console.error('Error:', JSON.stringify(userData, null, 2));
    process.exit(1);
  }
  
  console.log('User data:', JSON.stringify(userData, null, 2));
  
  const userId = userData.data?.id;
  if (!userId) {
    console.error('No user ID found');
    process.exit(1);
  }
  
  console.log(`\nFetching tweets for user ID: ${userId}`);
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  
  console.log('Tweets response status:', tweetsRes.status);
  const tweetsData = await tweetsRes.json();
  
  if (!tweetsRes.ok) {
    console.error('Error:', JSON.stringify(tweetsData, null, 2));
    process.exit(1);
  }
  
  console.log(`\nFound ${tweetsData.data?.length || 0} tweets:`);
  tweetsData.data?.forEach((tweet, i) => {
    console.log(`\n${i + 1}. ${tweet.text.slice(0, 100)}...`);
    console.log(`   Likes: ${tweet.public_metrics?.like_count}, RTs: ${tweet.public_metrics?.retweet_count}`);
  });
  
  console.log('\n✓ Twitter API working!');
}

testTwitterApi().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
