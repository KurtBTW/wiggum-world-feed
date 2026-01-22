// DEX Screener API Service - Fetch trending tokens and new launches
import type { DexScreenerPair, DexScreenerToken, SupportedChain } from '@/types';
import { SUPPORTED_CHAINS } from '@/types';

const BASE_URL = 'https://api.dexscreener.com';

// Rate limiting: 60 requests per minute
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'HypurrRelevancy/1.0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`DEX Screener API error: ${response.status} ${response.statusText}`);
  }
  
  return response;
}

/**
 * Get latest token profiles (newly listed tokens)
 */
export async function getLatestTokenProfiles(): Promise<DexScreenerToken[]> {
  try {
    const response = await rateLimitedFetch(`${BASE_URL}/token-profiles/latest/v1`);
    const data = await response.json();
    
    // Filter to supported chains and transform
    return (data || [])
      .filter((token: any) => SUPPORTED_CHAINS.includes(token.chainId as SupportedChain))
      .map((token: any) => transformTokenProfile(token));
  } catch (error) {
    console.error('[DEX Screener] Error fetching latest profiles:', error);
    return [];
  }
}

/**
 * Search for token pairs by query
 */
export async function searchTokens(query: string): Promise<DexScreenerPair[]> {
  try {
    const response = await rateLimitedFetch(`${BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    
    return (data.pairs || [])
      .filter((pair: DexScreenerPair) => SUPPORTED_CHAINS.includes(pair.chainId as SupportedChain));
  } catch (error) {
    console.error('[DEX Screener] Error searching tokens:', error);
    return [];
  }
}

/**
 * Get pairs for a specific chain
 */
export async function getPairsByChain(chainId: SupportedChain, pairAddresses: string[]): Promise<DexScreenerPair[]> {
  if (pairAddresses.length === 0) return [];
  
  try {
    const addresses = pairAddresses.slice(0, 30).join(','); // Max 30 addresses per request
    const response = await rateLimitedFetch(`${BASE_URL}/latest/dex/pairs/${chainId}/${addresses}`);
    const data = await response.json();
    
    return data.pairs || [];
  } catch (error) {
    console.error(`[DEX Screener] Error fetching pairs for ${chainId}:`, error);
    return [];
  }
}

/**
 * Get token info by address
 */
export async function getTokenByAddress(chainId: SupportedChain, tokenAddress: string): Promise<DexScreenerPair[]> {
  try {
    const response = await rateLimitedFetch(`${BASE_URL}/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();
    
    return (data.pairs || [])
      .filter((pair: DexScreenerPair) => pair.chainId === chainId);
  } catch (error) {
    console.error(`[DEX Screener] Error fetching token ${tokenAddress}:`, error);
    return [];
  }
}

/**
 * Get trending/boosted tokens
 */
export async function getTrendingTokens(): Promise<DexScreenerToken[]> {
  try {
    // DEX Screener doesn't have a direct trending endpoint, so we'll use token-boosts
    const response = await rateLimitedFetch(`${BASE_URL}/token-boosts/latest/v1`);
    const data = await response.json();
    
    return (data || [])
      .filter((token: any) => SUPPORTED_CHAINS.includes(token.chainId as SupportedChain))
      .slice(0, 20)
      .map((token: any) => transformTokenProfile(token));
  } catch (error) {
    console.error('[DEX Screener] Error fetching trending tokens:', error);
    return [];
  }
}

/**
 * Get top gainers across supported chains
 */
export async function getTopGainers(): Promise<DexScreenerPair[]> {
  const allPairs: DexScreenerPair[] = [];
  
  // Fetch from multiple chains in parallel
  const chainPromises = SUPPORTED_CHAINS.slice(0, 5).map(async (chain) => {
    try {
      // Search for popular base tokens on each chain
      const response = await rateLimitedFetch(`${BASE_URL}/latest/dex/search?q=${chain}`);
      const data = await response.json();
      return (data.pairs || []).slice(0, 10);
    } catch {
      return [];
    }
  });
  
  const results = await Promise.all(chainPromises);
  results.forEach(pairs => allPairs.push(...pairs));
  
  // Sort by 24h price change and filter positive gainers
  return allPairs
    .filter(pair => pair.priceChange?.h24 > 0)
    .sort((a, b) => (b.priceChange?.h24 || 0) - (a.priceChange?.h24 || 0))
    .slice(0, 20);
}

/**
 * Fetch all new tokens across supported chains (for ingestion)
 */
export async function fetchNewTokensForIngestion(): Promise<{
  tokens: DexScreenerToken[];
  pairs: DexScreenerPair[];
}> {
  console.log('[DEX Screener] Fetching new tokens for ingestion...');
  
  const [latestProfiles, trendingTokens] = await Promise.all([
    getLatestTokenProfiles(),
    getTrendingTokens()
  ]);
  
  // Combine and dedupe
  const tokenMap = new Map<string, DexScreenerToken>();
  
  [...latestProfiles, ...trendingTokens].forEach(token => {
    const key = `${token.chainId}-${token.tokenAddress}`;
    if (!tokenMap.has(key)) {
      tokenMap.set(key, token);
    }
  });
  
  const tokens = Array.from(tokenMap.values());
  
  // Fetch pair data for tokens to get more details
  const pairs: DexScreenerPair[] = [];
  
  // Group tokens by chain
  const tokensByChain = new Map<string, string[]>();
  tokens.forEach(token => {
    const existing = tokensByChain.get(token.chainId) || [];
    existing.push(token.tokenAddress);
    tokensByChain.set(token.chainId, existing);
  });
  
  // Fetch pairs for each chain
  for (const [chainId, addresses] of tokensByChain) {
    if (SUPPORTED_CHAINS.includes(chainId as SupportedChain)) {
      const chainPairs = await getPairsByChain(chainId as SupportedChain, addresses);
      pairs.push(...chainPairs);
    }
  }
  
  console.log(`[DEX Screener] Found ${tokens.length} tokens, ${pairs.length} pairs`);
  
  return { tokens, pairs };
}

/**
 * Transform token profile to our format
 */
function transformTokenProfile(token: any): DexScreenerToken {
  return {
    chainId: token.chainId || '',
    tokenAddress: token.tokenAddress || '',
    symbol: token.symbol || token.header || 'UNKNOWN',
    name: token.description || token.header || 'Unknown Token',
    priceUsd: parseFloat(token.priceUsd) || 0,
    priceChange24h: parseFloat(token.priceChange?.h24) || 0,
    volume24h: parseFloat(token.volume?.h24) || 0,
    liquidity: parseFloat(token.liquidity?.usd) || 0,
    fdv: parseFloat(token.fdv) || 0,
    pairAddress: token.pairAddress || '',
    dexId: token.dexId || '',
    url: token.url || `https://dexscreener.com/${token.chainId}/${token.tokenAddress}`,
    imageUrl: token.icon || token.header?.includes('http') ? token.header : undefined,
    createdAt: token.pairCreatedAt || Date.now()
  };
}

/**
 * Transform pair to token format
 */
export function pairToToken(pair: DexScreenerPair): DexScreenerToken {
  return {
    chainId: pair.chainId,
    tokenAddress: pair.baseToken.address,
    symbol: pair.baseToken.symbol,
    name: pair.baseToken.name,
    priceUsd: parseFloat(pair.priceUsd) || 0,
    priceChange24h: pair.priceChange?.h24 || 0,
    volume24h: pair.volume?.h24 || 0,
    liquidity: pair.liquidity?.usd || 0,
    fdv: pair.fdv || 0,
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    url: pair.url,
    imageUrl: undefined,
    createdAt: pair.pairCreatedAt || Date.now()
  };
}

/**
 * Get chain display name
 */
export function getChainDisplayName(chainId: string): string {
  const chainNames: Record<string, string> = {
    'solana': 'Solana',
    'ethereum': 'Ethereum',
    'base': 'Base',
    'arbitrum': 'Arbitrum',
    'hyperliquid': 'Hyperliquid',
    'bsc': 'BNB Chain',
    'sui': 'Sui',
    'avalanche': 'Avalanche',
    'polygon': 'Polygon',
    'berachain': 'Berachain'
  };
  return chainNames[chainId] || chainId;
}
