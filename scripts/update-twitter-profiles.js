require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

async function fetchUserProfile(username) {
  const response = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=profile_image_url`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  
  if (!response.ok) {
    console.log(`  ✗ Failed to fetch @${username}: ${response.status}`);
    return null;
  }
  
  const data = await response.json();
  return data.data;
}

async function main() {
  console.log('Updating Twitter profile pictures...\n');
  
  const accounts = await prisma.twitterAccount.findMany();
  let updated = 0;
  
  for (const account of accounts) {
    console.log(`@${account.username}...`);
    
    const profile = await fetchUserProfile(account.username);
    
    if (profile?.profile_image_url) {
      const hdImageUrl = profile.profile_image_url.replace('_normal', '_400x400');
      
      await prisma.twitterAccount.update({
        where: { id: account.id },
        data: {
          profileImageUrl: hdImageUrl,
          twitterId: profile.id,
        },
      });
      
      console.log(`  ✓ Updated with ${hdImageUrl.slice(0, 50)}...`);
      updated++;
    } else {
      console.log(`  - No profile image found`);
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log(`\nDone! Updated ${updated}/${accounts.length} accounts.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
