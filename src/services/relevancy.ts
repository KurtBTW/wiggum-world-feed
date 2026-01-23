// Relevancy Scoring Service - Uses GPT to score article relevancy to HypurrFi users
import OpenAI from 'openai';
import type { Category } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface RelevancyResult {
  score: number; // 0-100
  reason: string; // Brief explanation
}

const CATEGORY_CONTEXT: Record<Category, string> = {
  defi_alpha: 'DeFi protocols, yield farming, liquidity provision, TVL changes, and decentralized finance opportunities',
  token_launches: 'New token launches, IDOs, airdrops, and emerging cryptocurrencies',
  security_alerts: 'Crypto security incidents, hacks, exploits, rug pulls, and security vulnerabilities',
  ai_frontier: 'AI developments, machine learning breakthroughs, AI agents, and frontier AI models'
};

const HYPURRFI_USER_PROFILE = `
HypurrFi users are:
- Active crypto traders focused on Hyperliquid L1 and HyperEVM ecosystem
- Interested in DeFi yields, perpetual trading, and new token opportunities
- Tech-savvy individuals following AI developments that could impact crypto/trading
- Security-conscious about their crypto holdings
- Looking for alpha and early opportunities in the Hyperliquid ecosystem
- Interested in: HYPE token, HyperEVM protocols, Solana, Ethereum, Bitcoin price movements
- Trading-focused: looking for actionable insights, not just general news
`;

/**
 * Score an article's relevancy to HypurrFi users using GPT
 */
export async function scoreRelevancy(
  title: string,
  excerpt: string | null,
  category: Category,
  sourceName: string
): Promise<RelevancyResult> {
  const categoryContext = CATEGORY_CONTEXT[category];
  
  const prompt = `You are a relevancy scoring system for HypurrRelevant, a news aggregator for HypurrFi users.

${HYPURRFI_USER_PROFILE}

Category: ${category.replace('_', ' ').toUpperCase()}
Category Focus: ${categoryContext}

Article to score:
Title: ${title}
Source: ${sourceName}
${excerpt ? `Excerpt: ${excerpt}` : ''}

Score this article from 0-100 based on how relevant and valuable it would be to a HypurrFi user.

Scoring guidelines:
- 90-100: Directly about Hyperliquid, HYPE, HyperEVM, or major crypto event affecting trading
- 70-89: Highly relevant to crypto trading, DeFi, or AI that impacts crypto
- 50-69: Moderately relevant, general crypto/AI news with some trading implications
- 30-49: Tangentially relevant, broad tech/finance news
- 0-29: Low relevance, not actionable for crypto traders

Respond with ONLY valid JSON in this exact format:
{"score": <number 0-100>, "reason": "<brief 5-10 word explanation>"}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using mini for cost efficiency on bulk scoring
      messages: [
        { role: 'system', content: 'You are a precise relevancy scoring system. Respond only with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 100
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from GPT');
    }

    // Parse JSON response
    const result = JSON.parse(content);
    
    return {
      score: Math.min(100, Math.max(0, Math.round(result.score))),
      reason: result.reason || 'Scored by AI'
    };
  } catch (error) {
    console.error('[Relevancy] Error scoring article:', error);
    
    // Fallback: use keyword-based scoring
    return fallbackScoring(title, excerpt, category);
  }
}

/**
 * Fallback keyword-based scoring when GPT fails
 */
function fallbackScoring(
  title: string,
  excerpt: string | null,
  category: Category
): RelevancyResult {
  const text = `${title} ${excerpt || ''}`.toLowerCase();
  let score = 50; // Base score
  
  // High relevancy keywords
  const highKeywords = ['hyperliquid', 'hype', 'hypurr', 'hyperevm'];
  const mediumKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol', 'defi', 'trading', 'perps', 'perpetual'];
  const lowKeywords = ['crypto', 'blockchain', 'token', 'nft', 'web3'];
  
  for (const keyword of highKeywords) {
    if (text.includes(keyword)) score += 30;
  }
  
  for (const keyword of mediumKeywords) {
    if (text.includes(keyword)) score += 10;
  }
  
  for (const keyword of lowKeywords) {
    if (text.includes(keyword)) score += 5;
  }
  
  // Cap at 100
  score = Math.min(100, score);
  
  return {
    score,
    reason: 'Keyword-based scoring'
  };
}

/**
 * Batch score multiple articles (more efficient)
 */
export async function batchScoreRelevancy(
  articles: Array<{
    id: string;
    title: string;
    excerpt: string | null;
    category: Category;
    sourceName: string;
  }>
): Promise<Map<string, RelevancyResult>> {
  const results = new Map<string, RelevancyResult>();
  
  // Process in parallel batches of 5 to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < articles.length; i += batchSize) {
    const batch = articles.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (article) => {
        const result = await scoreRelevancy(
          article.title,
          article.excerpt,
          article.category,
          article.sourceName
        );
        return { id: article.id, result };
      })
    );
    
    for (const { id, result } of batchResults) {
      results.set(id, result);
    }
  }
  
  return results;
}
