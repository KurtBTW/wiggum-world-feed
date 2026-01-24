import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });
  
  return response.data.map(d => d.embedding);
}

interface KnowledgeItemInput {
  content: string;
  sourceType: string;
  sourceUrl?: string;
  sourceId?: string;
  protocolSlug?: string;
  author?: string;
  category?: string;
  importance?: number;
  publishedAt?: Date;
}

export async function addKnowledgeItem(item: KnowledgeItemInput): Promise<string> {
  const embedding = await generateEmbedding(item.content);
  
  const knowledgeItem = await prisma.knowledgeItem.create({
    data: {
      content: item.content,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      sourceId: item.sourceId,
      protocolSlug: item.protocolSlug,
      author: item.author,
      category: item.category,
      importance: item.importance ?? 0.5,
      publishedAt: item.publishedAt,
    },
  });
  
  const embeddingStr = `[${embedding.join(',')}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE "KnowledgeItem" SET embedding = $1::vector WHERE id = $2`,
    embeddingStr,
    knowledgeItem.id
  );
  
  return knowledgeItem.id;
}

export async function addKnowledgeItemsBatch(items: KnowledgeItemInput[]): Promise<number> {
  if (items.length === 0) return 0;
  
  const batchSize = 20;
  let added = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch.map(item => item.content));
    
    for (let j = 0; j < batch.length; j++) {
      const item = batch[j];
      const embedding = embeddings[j];
      
      try {
        const existing = item.sourceId 
          ? await prisma.knowledgeItem.findUnique({ where: { sourceId: item.sourceId } })
          : null;
          
        if (existing) continue;
        
        const knowledgeItem = await prisma.knowledgeItem.create({
          data: {
            content: item.content,
            sourceType: item.sourceType,
            sourceUrl: item.sourceUrl,
            sourceId: item.sourceId,
            protocolSlug: item.protocolSlug,
            author: item.author,
            category: item.category,
            importance: item.importance ?? 0.5,
            publishedAt: item.publishedAt,
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
        console.error('Error adding knowledge item:', e);
      }
    }
  }
  
  return added;
}

export interface SearchResult {
  id: string;
  content: string;
  sourceType: string;
  sourceUrl: string | null;
  author: string | null;
  protocolSlug: string | null;
  category: string | null;
  publishedAt: Date | null;
  similarity: number;
}

export async function searchKnowledge(
  query: string,
  limit: number = 10,
  filters?: {
    sourceType?: string;
    protocolSlug?: string;
    category?: string;
  }
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingStr = `[${queryEmbedding.join(',')}]`;
  
  let whereClause = '';
  const conditions: string[] = [];
  
  if (filters?.sourceType) {
    conditions.push(`"sourceType" = '${filters.sourceType}'`);
  }
  if (filters?.protocolSlug) {
    conditions.push(`"protocolSlug" = '${filters.protocolSlug}'`);
  }
  if (filters?.category) {
    conditions.push(`category = '${filters.category}'`);
  }
  
  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(' AND ')}`;
  }
  
  const results = await prisma.$queryRawUnsafe<SearchResult[]>(`
    SELECT 
      id,
      content,
      "sourceType",
      "sourceUrl",
      author,
      "protocolSlug",
      category,
      "publishedAt",
      1 - (embedding <=> $1::vector) as similarity
    FROM "KnowledgeItem"
    ${whereClause}
    ORDER BY embedding <=> $1::vector
    LIMIT $2
  `, embeddingStr, limit);
  
  return results;
}
