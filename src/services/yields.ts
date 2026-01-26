const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi/pools';

export interface VaultYield {
  apy: number;
  tvlUsd: number;
  source: string;
}

export interface AllYields {
  lhype: VaultYield;
  khype: VaultYield;
  xhype: VaultYield;
  xbtc: VaultYield;
}

let cachedYields: AllYields | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

async function fetchDefiLlamaYields(): Promise<Map<string, { apy: number; tvlUsd: number }>> {
  const res = await fetch(DEFILLAMA_YIELDS_API, { 
    next: { revalidate: 300 }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch DeFiLlama yields');
  }
  
  const json = await res.json();
  const pools = json.data || [];
  
  const yields = new Map<string, { apy: number; tvlUsd: number }>();
  
  for (const pool of pools) {
    const chain = (pool.chain || '').toLowerCase();
    const project = (pool.project || '').toLowerCase();
    const symbol = (pool.symbol || '').toUpperCase();
    
    const isHyperliquid = chain.includes('hyper') || chain.includes('hype');
    
    if (project === 'liminal' && symbol === 'XHYPE' && isHyperliquid) {
      if (!yields.has('xhype') || pool.tvlUsd > (yields.get('xhype')?.tvlUsd || 0)) {
        yields.set('xhype', { apy: pool.apy, tvlUsd: pool.tvlUsd });
      }
    }
    
    if (project === 'liminal' && symbol === 'XBTC' && isHyperliquid) {
      if (!yields.has('xbtc') || pool.tvlUsd > (yields.get('xbtc')?.tvlUsd || 0)) {
        yields.set('xbtc', { apy: pool.apy, tvlUsd: pool.tvlUsd });
      }
    }
    
    if (project === 'harmonix-finance' && symbol === 'KHYPE' && isHyperliquid) {
      if (!yields.has('khype') || pool.tvlUsd > (yields.get('khype')?.tvlUsd || 0)) {
        yields.set('khype', { apy: pool.apy, tvlUsd: pool.tvlUsd });
      }
    }
    
    if (project === 'pendle' && symbol === 'KHYPE' && isHyperliquid) {
      const existing = yields.get('khype');
      if (!existing || pool.tvlUsd > existing.tvlUsd) {
        yields.set('khype', { apy: pool.apy, tvlUsd: pool.tvlUsd });
      }
    }
  }
  
  return yields;
}

export async function fetchAllYields(): Promise<AllYields> {
  const now = Date.now();
  if (cachedYields && now - cacheTimestamp < CACHE_TTL) {
    return cachedYields;
  }
  
  try {
    const defiLlamaYields = await fetchDefiLlamaYields();
    
    const xhypeData = defiLlamaYields.get('xhype');
    const xbtcData = defiLlamaYields.get('xbtc');
    const khypeData = defiLlamaYields.get('khype');
    
    cachedYields = {
      lhype: {
        apy: 0,
        tvlUsd: 0,
        source: 'looping-api',
      },
      khype: {
        apy: khypeData?.apy || 4.0,
        tvlUsd: khypeData?.tvlUsd || 0,
        source: khypeData ? 'defillama' : 'fallback',
      },
      xhype: {
        apy: xhypeData?.apy || 4.5,
        tvlUsd: xhypeData?.tvlUsd || 0,
        source: xhypeData ? 'defillama' : 'fallback',
      },
      xbtc: {
        apy: xbtcData?.apy || 4.0,
        tvlUsd: xbtcData?.tvlUsd || 0,
        source: xbtcData ? 'defillama' : 'fallback',
      },
    };
    
    cacheTimestamp = now;
    return cachedYields;
  } catch (error) {
    console.error('[Yields] Failed to fetch yields:', error);
    
    return {
      lhype: { apy: 3.4, tvlUsd: 20_000_000, source: 'fallback' },
      khype: { apy: 4.0, tvlUsd: 0, source: 'fallback' },
      xhype: { apy: 4.5, tvlUsd: 3_800_000, source: 'fallback' },
      xbtc: { apy: 4.0, tvlUsd: 0, source: 'fallback' },
    };
  }
}

export async function fetchVaultYield(vault: 'lhype' | 'khype' | 'xhype' | 'xbtc'): Promise<VaultYield> {
  const allYields = await fetchAllYields();
  return allYields[vault];
}
