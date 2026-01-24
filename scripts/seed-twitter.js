const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const accounts = [
  { username: 'HypurrFi', displayName: 'HypurrFi', accountType: 'PROTOCOL' },
  { username: 'androolloyd', displayName: 'Androo Lloyd', accountType: 'FOUNDER', personName: 'Androo Lloyd', personRole: 'Co-founder/CEO' },
  { username: 'andyhyfi', displayName: 'Andy Boyan', accountType: 'TEAM', personName: 'Andy Boyan', personRole: 'Head of Growth' },
  { username: 'KurtG', displayName: 'Kurt G', accountType: 'TEAM', personName: 'Kurt G', personRole: 'Team' },
  { username: 'holdforscott', displayName: 'Scott', accountType: 'TEAM', personName: 'Scott', personRole: 'Team' },
  { username: 'ClearstarLabs', displayName: 'Clearstar Labs', accountType: 'PROTOCOL' },
  { username: 'Alacomm', displayName: 'Alexander Maly', accountType: 'FOUNDER', personName: 'Alexander Maly', personRole: 'Co-founder' },
  { username: 'eulerfinance', displayName: 'Euler Finance', accountType: 'PROTOCOL' },
  { username: 'euler_mab', displayName: 'Michael Bentley', accountType: 'FOUNDER', personName: 'Michael Bentley', personRole: 'Co-founder' },
  { username: '0xJHan', displayName: 'Jonathan Han', accountType: 'FOUNDER', personName: 'Jonathan Han', personRole: 'CEO' },
  { username: 'gupta_kanv', displayName: 'Kanv Gupta', accountType: 'TEAM', personName: 'Kanv Gupta', personRole: 'Team' },
];

async function seed() {
  console.log('Seeding Twitter accounts...\n');
  let created = 0;
  
  for (const acc of accounts) {
    const existing = await prisma.twitterAccount.findUnique({ 
      where: { username: acc.username } 
    });
    
    if (!existing) {
      await prisma.twitterAccount.create({ data: acc });
      console.log(`✓ Created: @${acc.username}`);
      created++;
    } else {
      console.log(`- Exists: @${acc.username}`);
    }
  }
  
  console.log(`\nDone! Created ${created} new accounts.`);
  
  const total = await prisma.twitterAccount.count();
  console.log(`Total accounts in database: ${total}`);
  
  await prisma.$disconnect();
}

seed().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
