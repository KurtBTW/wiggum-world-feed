const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up pgvector...');
  
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log('✓ pgvector extension enabled');
  } catch (e) {
    console.log('pgvector extension already exists or error:', e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "KnowledgeItem" 
      ADD COLUMN IF NOT EXISTS embedding vector(1536);
    `);
    console.log('✓ embedding column added to KnowledgeItem');
  } catch (e) {
    console.log('embedding column already exists or error:', e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS knowledge_item_embedding_idx 
      ON "KnowledgeItem" 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✓ vector similarity index created');
  } catch (e) {
    if (e.message.includes('at least 100 rows')) {
      console.log('Note: IVFFlat index needs 100+ rows. Will create after data import.');
    } else {
      console.log('Index creation note:', e.message);
    }
  }
  
  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
