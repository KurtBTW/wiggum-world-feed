// RSS Feed and API Ingestion Service
import Parser from 'rss-parser';
import { prisma } from '@/lib/prisma';
import { getSourcesForCategory, getGlobalThresholds, RSS_CATEGORIES } from './config';
import { fetchNewTokensForIngestion, pairToToken, getChainDisplayName } from './dexscreener';
import { fetchDefiUpdatesForIngestion, formatTVL, formatChange } from './defillama';
import { checkTokenSecurity, passesSecurityCheck, getSecurityReasons } from './goplus';
import type { Category, Source, SupportedChain, DexScreenerToken } from '@/types';

// Custom RSS parser with media support
type CustomFeed = { items: CustomItem[] };
type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
  enclosure?: { url?: string; type?: string };
  'media:content'?: { $?: { url?: string } };
  'media:thumbnail'?: { $?: { url?: string } };
  'content:encoded'?: string;
};

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'HypurrRelevancy/1.0 (RSS Reader)',
  },
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
      ['enclosure', 'enclosure'],
    ],
  },
});

interface IngestResult {
  category: Category;
  totalFetched: number;
  newItems: number;
  duplicates: number;
  hiddenBySecurity: number;
  errors: string[];
}

/**
 * Ingest items from all RSS sources for a category
 */
export async function ingestCategory(category: Category): Promise<IngestResult> {
  const result: IngestResult = {
    category,
    totalFetched: 0,
    newItems: 0,
    duplicates: 0,
    hiddenBySecurity: 0,
    errors: [],
  };

  // Handle token_launches specially (API-based)
  if (category === 'token_launches') {
    return await ingestTokenLaunches();
  }

  const sourceConfig = getSourcesForCategory(category);
  if (!sourceConfig?.rss) {
    return result;
  }

  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  for (const source of sourceConfig.rss) {
    try {
      const items = await fetchRSSFeed(source);
      result.totalFetched += items.length;

      for (const item of items) {
        if (!item.link || !item.title) continue;

        // Check if within time window
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        if (publishedAt < windowStart) continue;

        // Check for duplicates
        const existing = await prisma.ingestedItem.findUnique({
          where: { url: item.link },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Extract image URL from various RSS fields
        const imageUrl = extractImageUrl(item);

        // Create new item
        try {
          await prisma.ingestedItem.create({
            data: {
              title: cleanTitle(item.title),
              originalTitle: item.title,
              url: item.link,
              canonicalUrl: extractCanonicalUrl(item.link),
              imageUrl,
              source: source.url,
              sourceName: source.name,
              category: category,
              publishedAt,
              excerpt: item.contentSnippet?.slice(0, 500),
              snippet: item.content?.slice(0, 1000),
              credibilityScore: getCredibilityScore(source.credibility),
            },
          });
          result.newItems++;
        } catch (createError) {
          // Likely a race condition duplicate
          result.duplicates++;
        }
      }
    } catch (error) {
      result.errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Ingest token launches from DEX Screener with security checks
 */
async function ingestTokenLaunches(): Promise<IngestResult> {
  const result: IngestResult = {
    category: 'token_launches',
    totalFetched: 0,
    newItems: 0,
    duplicates: 0,
    hiddenBySecurity: 0,
    errors: [],
  };

  try {
    console.log('[Ingestion] Fetching token launches from DEX Screener...');
    const { tokens, pairs } = await fetchNewTokensForIngestion();
    
    // Combine tokens from profiles and pairs
    const allTokens: DexScreenerToken[] = [
      ...tokens,
      ...pairs.map(p => pairToToken(p))
    ];
    
    // Dedupe by chainId + tokenAddress
    const tokenMap = new Map<string, DexScreenerToken>();
    allTokens.forEach(token => {
      const key = `${token.chainId}-${token.tokenAddress}`;
      if (!tokenMap.has(key)) {
        tokenMap.set(key, token);
      }
    });
    
    const uniqueTokens = Array.from(tokenMap.values());
    result.totalFetched = uniqueTokens.length;
    
    for (const token of uniqueTokens) {
      // Create unique URL for deduplication
      const tokenUrl = token.url || `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`;
      
      // Check for duplicates
      const existing = await prisma.ingestedItem.findUnique({
        where: { url: tokenUrl },
      });

      if (existing) {
        result.duplicates++;
        continue;
      }
      
      // Check token security
      let securityResult = null;
      let hiddenBySecurity = false;
      
      try {
        securityResult = await checkTokenSecurity(
          token.chainId as SupportedChain, 
          token.tokenAddress
        );
        
        if (securityResult && !passesSecurityCheck(securityResult)) {
          hiddenBySecurity = true;
          result.hiddenBySecurity++;
          console.log(`[Security] Hiding ${token.symbol} on ${token.chainId}: ${getSecurityReasons(securityResult).join(', ')}`);
        }
      } catch (secError) {
        console.log(`[Security] Could not check ${token.symbol}: ${secError}`);
      }
      
      // Create item
      try {
        await prisma.ingestedItem.create({
          data: {
            title: `${token.symbol} on ${getChainDisplayName(token.chainId)}`,
            originalTitle: `${token.name} (${token.symbol})`,
            url: tokenUrl,
            imageUrl: token.imageUrl,
            source: 'dexscreener',
            sourceName: 'DEX Screener',
            category: 'token_launches',
            publishedAt: new Date(token.createdAt),
            excerpt: `New token: ${token.name} (${token.symbol}) trading at $${token.priceUsd.toFixed(6)} with $${(token.volume24h || 0).toLocaleString()} 24h volume`,
            
            // Token-specific fields
            chainId: token.chainId,
            tokenAddress: token.tokenAddress,
            tokenSymbol: token.symbol,
            priceUsd: token.priceUsd,
            priceChange24h: token.priceChange24h,
            volume24h: token.volume24h,
            liquidity: token.liquidity,
            fdv: token.fdv,
            pairAddress: token.pairAddress,
            dexId: token.dexId,
            
            // Security fields
            securityScore: securityResult?.trustScore,
            riskLevel: securityResult?.riskLevel,
            isHoneypot: securityResult?.isHoneypot,
            securityData: securityResult ? JSON.stringify(securityResult) : null,
            
            hiddenBySecurity,
            credibilityScore: 0.5, // Neutral for new tokens
          },
        });
        result.newItems++;
      } catch (createError) {
        result.duplicates++;
      }
    }
    
    console.log(`[Ingestion] Token launches: ${result.newItems} new, ${result.duplicates} duplicates, ${result.hiddenBySecurity} hidden by security`);
  } catch (error) {
    result.errors.push(`DEX Screener: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('[Ingestion] Error fetching token launches:', error);
  }

  return result;
}

/**
 * Ingest DeFi protocol updates (TVL movers)
 */
export async function ingestDefiAlpha(): Promise<IngestResult> {
  const result: IngestResult = {
    category: 'defi_alpha',
    totalFetched: 0,
    newItems: 0,
    duplicates: 0,
    hiddenBySecurity: 0,
    errors: [],
  };

  try {
    console.log('[Ingestion] Fetching DeFi alpha from DefiLlama...');
    const { protocols, yields } = await fetchDefiUpdatesForIngestion();
    
    result.totalFetched = protocols.length;
    
    for (const protocol of protocols) {
      const protocolUrl = protocol.url || `https://defillama.com/protocol/${protocol.id}`;
      
      // Check for duplicates
      const existing = await prisma.ingestedItem.findUnique({
        where: { url: protocolUrl },
      });

      if (existing) {
        result.duplicates++;
        continue;
      }
      
      const changeDirection = protocol.change_1d >= 0 ? 'up' : 'down';
      const changeEmoji = protocol.change_1d >= 0 ? '📈' : '📉';
      
      try {
        await prisma.ingestedItem.create({
          data: {
            title: `${protocol.name} TVL ${changeEmoji} ${formatChange(protocol.change_1d)}`,
            originalTitle: `${protocol.name} (${protocol.symbol || 'N/A'})`,
            url: protocolUrl,
            imageUrl: protocol.logo,
            source: 'defillama',
            sourceName: 'DefiLlama',
            category: 'defi_alpha',
            publishedAt: new Date(),
            excerpt: `${protocol.name} TVL is now ${formatTVL(protocol.tvl)}, ${changeDirection} ${Math.abs(protocol.change_1d).toFixed(2)}% in 24h. Category: ${protocol.category}`,
            
            // DeFi-specific fields
            tvl: protocol.tvl,
            tvlChange24h: protocol.change_1d,
            protocolName: protocol.name,
            
            credibilityScore: 0.8, // DefiLlama is reliable
          },
        });
        result.newItems++;
      } catch (createError) {
        result.duplicates++;
      }
    }
    
    console.log(`[Ingestion] DeFi alpha: ${result.newItems} new, ${result.duplicates} duplicates`);
  } catch (error) {
    result.errors.push(`DefiLlama: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('[Ingestion] Error fetching DeFi alpha:', error);
  }

  return result;
}

/**
 * Extract image URL from RSS item
 */
function extractImageUrl(item: CustomItem): string | null {
  // Try enclosure first (common for podcasts and news)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  // Try media:content
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url;
  }
  
  // Try media:thumbnail
  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url;
  }
  
  // Try to extract from content:encoded or content
  const content = item['content:encoded'] || item.content || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  // Try og:image pattern in content
  const ogMatch = content.match(/og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1];
  }
  
  return null;
}

/**
 * Ingest all categories
 */
export async function ingestAllCategories(): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  // Ingest RSS-based categories
  for (const category of RSS_CATEGORIES) {
    const result = await ingestCategory(category);
    results.push(result);
    console.log(`[Ingestion] ${category}: ${result.newItems} new, ${result.duplicates} duplicates`);
  }
  
  // Ingest token launches from DEX Screener
  const tokenResult = await ingestCategory('token_launches');
  results.push(tokenResult);
  
  // Ingest DeFi alpha from DefiLlama (supplement RSS)
  const defiResult = await ingestDefiAlpha();
  // Merge with existing defi_alpha result
  const existingDefiResult = results.find(r => r.category === 'defi_alpha');
  if (existingDefiResult) {
    existingDefiResult.totalFetched += defiResult.totalFetched;
    existingDefiResult.newItems += defiResult.newItems;
    existingDefiResult.duplicates += defiResult.duplicates;
    existingDefiResult.errors.push(...defiResult.errors);
  }

  return results;
}

/**
 * Fetch items from an RSS feed
 */
async function fetchRSSFeed(source: Source): Promise<CustomItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items;
  } catch (error) {
    console.error(`[RSS Error] ${source.name}: ${error}`);
    return [];
  }
}

/**
 * Clean up title text
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]/g, '') // Remove brackets
    .replace(/\(.*?\)/g, '') // Remove parentheses
    .trim();
}

/**
 * Extract canonical URL from a link
 */
function extractCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Get credibility score from credibility level
 */
function getCredibilityScore(credibility: string): number {
  switch (credibility) {
    case 'primary':
      return 1.0;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.4;
    default:
      return 0.5;
  }
}

/**
 * Get unprocessed items for a category
 */
export async function getUnprocessedItems(category: Category, limit = 100) {
  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  return prisma.ingestedItem.findMany({
    where: {
      category,
      processed: false,
      hiddenBySecurity: false, // Don't process hidden items
      publishedAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get candidates for tile selection (already scored items)
 */
export async function getCandidatesForCategory(category: Category, limit = 50) {
  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  return prisma.ingestedItem.findMany({
    where: {
      category,
      processed: true,
      hiddenBySecurity: false, // Don't show hidden items
      publishedAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      totalScore: 'desc',
    },
    take: limit,
  });
}

/**
 * Mark items as processed
 */
export async function markItemsProcessed(ids: string[]) {
  await prisma.ingestedItem.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      processed: true,
    },
  });
}
