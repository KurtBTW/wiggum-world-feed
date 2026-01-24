// DefiLlama API Service - TVL, Protocol data, and Yields
import type { DefiLlamaProtocol, DefiLlamaYield, SupportedChain } from '@/types';
import { SUPPORTED_CHAINS } from '@/types';
import { addKnowledgeItem } from './embeddings';
import { prisma } from '@/lib/prisma';

const BASE_URL = 'https://api.llama.fi';
const YIELDS_URL = 'https://yields.llama.fi';

// Cache for protocol data (refresh every 5 minutes)
let protocolCache: { data: DefiLlamaProtocol[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all protocols with TVL data
 */
export async function getAllProtocols(): Promise<DefiLlamaProtocol[]> {
  // Check cache
  if (protocolCache && Date.now() - protocolCache.timestamp < CACHE_TTL) {
    return protocolCache.data;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/protocols`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`DefiLlama API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to supported chains and transform
    const protocols: DefiLlamaProtocol[] = data
      .filter((p: any) => {
        const chains = p.chains || [];
        return chains.some((chain: string) => 
          SUPPORTED_CHAINS.includes(chain.toLowerCase() as SupportedChain)
        );
      })
      .map((p: any) => ({
        id: p.slug,
        name: p.name,
        symbol: p.symbol || '',
        chain: p.chain || p.chains?.[0] || '',
        chains: p.chains || [],
        tvl: p.tvl || 0,
        change_1h: p.change_1h || 0,
        change_1d: p.change_1d || 0,
        change_7d: p.change_7d || 0,
        category: p.category || 'Other',
        logo: p.logo || '',
        url: p.url || ''
      }));
    
    // Update cache
    protocolCache = { data: protocols, timestamp: Date.now() };
    
    return protocols;
  } catch (error) {
    console.error('[DefiLlama] Error fetching protocols:', error);
    return protocolCache?.data || [];
  }
}

/**
 * Get top protocols by TVL
 */
export async function getTopProtocols(limit = 20): Promise<DefiLlamaProtocol[]> {
  const protocols = await getAllProtocols();
  return protocols
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, limit);
}

/**
 * Get protocols with significant TVL changes (potential alpha)
 */
export async function getTVLMovers(minChangePct = 5): Promise<{
  gainers: DefiLlamaProtocol[];
  losers: DefiLlamaProtocol[];
}> {
  const protocols = await getAllProtocols();
  
  // Filter protocols with significant TVL (> $1M)
  const significantProtocols = protocols.filter(p => p.tvl > 1_000_000);
  
  const gainers = significantProtocols
    .filter(p => p.change_1d >= minChangePct)
    .sort((a, b) => b.change_1d - a.change_1d)
    .slice(0, 10);
  
  const losers = significantProtocols
    .filter(p => p.change_1d <= -minChangePct)
    .sort((a, b) => a.change_1d - b.change_1d)
    .slice(0, 10);
  
  return { gainers, losers };
}

/**
 * Get protocols by chain
 */
export async function getProtocolsByChain(chain: SupportedChain): Promise<DefiLlamaProtocol[]> {
  const protocols = await getAllProtocols();
  return protocols.filter(p => 
    p.chains.some(c => c.toLowerCase() === chain.toLowerCase())
  );
}

/**
 * Get TVL for a specific protocol
 */
export async function getProtocolTVL(slug: string): Promise<number | null> {
  try {
    const response = await fetch(`${BASE_URL}/tvl/${slug}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get yield pools (farming opportunities)
 */
export async function getYieldPools(): Promise<DefiLlamaYield[]> {
  try {
    const response = await fetch(`${YIELDS_URL}/pools`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`DefiLlama Yields API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter to supported chains and reasonable APYs
    return (data.data || [])
      .filter((pool: any) => {
        const chain = pool.chain?.toLowerCase();
        return SUPPORTED_CHAINS.includes(chain as SupportedChain) &&
               pool.tvlUsd > 100_000 && // Min $100k TVL
               pool.apy > 0 &&
               pool.apy < 1000; // Filter out unrealistic APYs
      })
      .map((pool: any) => ({
        pool: pool.pool,
        chain: pool.chain,
        project: pool.project,
        symbol: pool.symbol,
        tvlUsd: pool.tvlUsd,
        apyBase: pool.apyBase || 0,
        apyReward: pool.apyReward || 0,
        apy: pool.apy,
        rewardTokens: pool.rewardTokens || [],
        underlyingTokens: pool.underlyingTokens || []
      }))
      .sort((a: DefiLlamaYield, b: DefiLlamaYield) => b.apy - a.apy);
  } catch (error) {
    console.error('[DefiLlama] Error fetching yield pools:', error);
    return [];
  }
}

/**
 * Get top yield opportunities
 */
export async function getTopYields(limit = 20): Promise<DefiLlamaYield[]> {
  const pools = await getYieldPools();
  return pools.slice(0, limit);
}

/**
 * Get chain TVL summary
 */
export async function getChainTVL(): Promise<Map<string, number>> {
  try {
    const response = await fetch(`${BASE_URL}/v2/chains`);
    if (!response.ok) throw new Error('Failed to fetch chain TVL');
    
    const data = await response.json();
    const tvlMap = new Map<string, number>();
    
    for (const chain of data) {
      if (SUPPORTED_CHAINS.includes(chain.name?.toLowerCase() as SupportedChain)) {
        tvlMap.set(chain.name.toLowerCase(), chain.tvl);
      }
    }
    
    return tvlMap;
  } catch (error) {
    console.error('[DefiLlama] Error fetching chain TVL:', error);
    return new Map();
  }
}

/**
 * Get DeFi news/updates for ingestion (protocols with significant changes)
 */
export async function fetchDefiUpdatesForIngestion(): Promise<{
  protocols: DefiLlamaProtocol[];
  yields: DefiLlamaYield[];
}> {
  console.log('[DefiLlama] Fetching DeFi updates for ingestion...');
  
  const [movers, topYields] = await Promise.all([
    getTVLMovers(10), // 10% change threshold
    getTopYields(15)
  ]);
  
  const protocols = [...movers.gainers, ...movers.losers];
  
  console.log(`[DefiLlama] Found ${protocols.length} protocols with significant TVL changes, ${topYields.length} yield opportunities`);
  
  return {
    protocols,
    yields: topYields
  };
}

/**
 * Format TVL for display
 */
export function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  }
  if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  }
  if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(2)}K`;
  }
  return `$${tvl.toFixed(2)}`;
}

/**
 * Format percentage change
 */
export function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

/**
 * Ingest protocol metrics into knowledge store
 */
export async function ingestProtocolMetrics(): Promise<number> {
  const movers = await getTVLMovers(5);
  const topProtocols = await getTopProtocols(20);
  
  const allProtocols = [...movers.gainers, ...movers.losers, ...topProtocols];
  const seen = new Set<string>();
  let added = 0;
  
  for (const protocol of allProtocols) {
    if (seen.has(protocol.id)) continue;
    seen.add(protocol.id);
    
    const sourceId = `defillama-${protocol.id}-${new Date().toISOString().split('T')[0]}`;
    
    try {
      const existing = await prisma.knowledgeItem.findUnique({
        where: { sourceId },
      });
      
      if (existing) continue;
      
      const content = `[DeFiLlama Metrics] ${protocol.name}: TVL ${formatTVL(protocol.tvl)} (24h change: ${formatChange(protocol.change_1d)}). Category: ${protocol.category}. Chains: ${protocol.chains.slice(0, 5).join(', ')}.`;
      
      await addKnowledgeItem({
        content,
        sourceType: 'metrics',
        sourceUrl: `https://defillama.com/protocol/${protocol.id}`,
        sourceId,
        category: 'metrics',
        importance: protocol.tvl > 100_000_000 ? 0.7 : 0.5,
        publishedAt: new Date(),
      });
      added++;
    } catch (e) {
      console.error(`Failed to add metrics for ${protocol.name}:`, e);
    }
  }
  
  return added;
}

/**
 * Ingest yield data into knowledge store
 */
export async function ingestYieldData(): Promise<number> {
  const yields = await getTopYields(25);
  let added = 0;
  
  for (const pool of yields) {
    const sourceId = `defillama-yield-${pool.pool}-${new Date().toISOString().split('T')[0]}`;
    
    try {
      const existing = await prisma.knowledgeItem.findUnique({
        where: { sourceId },
      });
      
      if (existing) continue;
      
      const content = `[DeFiLlama Yields] ${pool.project} on ${pool.chain}: ${pool.symbol} pool with ${pool.apy.toFixed(2)}% APY. TVL: ${formatTVL(pool.tvlUsd)}.${pool.apyBase ? ` Base APY: ${pool.apyBase.toFixed(2)}%` : ''}${pool.apyReward ? ` Reward APY: ${pool.apyReward.toFixed(2)}%` : ''}`;
      
      await addKnowledgeItem({
        content,
        sourceType: 'metrics',
        sourceUrl: `https://defillama.com/yields?project=${pool.project}`,
        sourceId,
        category: 'metrics',
        importance: pool.apy > 20 ? 0.6 : 0.4,
        publishedAt: new Date(),
      });
      added++;
    } catch (e) {
      console.error(`Failed to add yield for ${pool.pool}:`, e);
    }
  }
  
  return added;
}

/**
 * Ingest all DeFiLlama data into knowledge store
 */
export async function ingestAllDeFiLlamaData(): Promise<{ protocols: number; yields: number }> {
  console.log('[DeFiLlama] Starting knowledge ingestion...');
  
  const protocols = await ingestProtocolMetrics();
  const yields = await ingestYieldData();
  
  console.log(`[DeFiLlama] Added ${protocols} protocol metrics, ${yields} yield pools to knowledge store`);
  
  return { protocols, yields };
}
