// Market Data Service - Track crypto prices for sidebar display
import { prisma } from '@/lib/prisma';
import { getMarketDataAssets } from './config';

interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
}

// Default assets to track
const DEFAULT_ASSETS: Array<{ symbol: string; name: string }> = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'HYPE', name: 'Hyperliquid' }
];

/**
 * Fetch and store market data for tracked assets
 */
export async function fetchMarketData(): Promise<CryptoQuote[]> {
  const results: CryptoQuote[] = [];
  
  // Use configured assets or defaults
  const configuredAssets = getMarketDataAssets();
  const assets = configuredAssets.length > 0 
    ? configuredAssets.map((a: any) => ({ symbol: a.symbol, name: a.name || a.symbol }))
    : DEFAULT_ASSETS;
  
  for (const asset of assets) {
    try {
      const data = await fetchYahooFinanceQuote(`${asset.symbol}-USD`);
      if (data) {
        const quote: CryptoQuote = {
          symbol: asset.symbol,
          name: asset.name,
          price: data.price,
          change24h: data.change24h,
          volume24h: data.volume24h,
          marketCap: data.marketCap
        };
        results.push(quote);
        
        // Upsert to database
        await prisma.marketData.upsert({
          where: { symbol: asset.symbol },
          update: {
            name: asset.name,
            price: data.price,
            change24h: data.change24h,
            volume24h: data.volume24h,
            marketCap: data.marketCap,
            updatedAt: new Date()
          },
          create: {
            symbol: asset.symbol,
            name: asset.name,
            price: data.price,
            change24h: data.change24h,
            volume24h: data.volume24h,
            marketCap: data.marketCap
          }
        });
      }
    } catch (error) {
      console.error(`[MarketData] Error fetching ${asset.symbol}:`, error);
    }
  }
  
  return results;
}

/**
 * Fetch quote from Yahoo Finance
 */
async function fetchYahooFinanceQuote(symbol: string): Promise<{
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
} | null> {
  try {
    // Yahoo Finance v8 API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      return null;
    }
    
    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;
    
    if (!meta || !quotes || !timestamps || timestamps.length < 2) {
      return null;
    }
    
    // Current price
    const price = meta.regularMarketPrice || quotes.close?.[quotes.close.length - 1];
    
    // Calculate 24h change
    const lastIndex = timestamps.length - 1;
    const prevIndex = lastIndex - 1;
    const prevClose = quotes.close?.[prevIndex];
    const currentClose = quotes.close?.[lastIndex];
    
    if (!price || !prevClose || !currentClose) {
      return null;
    }
    
    const change24h = ((currentClose - prevClose) / prevClose) * 100;
    
    // Volume (last period)
    const volume24h = quotes.volume?.[lastIndex];
    
    // Market cap from meta if available
    const marketCap = meta.marketCap;
    
    return {
      price,
      change24h,
      volume24h,
      marketCap
    };
  } catch (error) {
    console.error(`[YahooFinance] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Get cached market data from database
 */
export async function getCachedMarketData(): Promise<CryptoQuote[]> {
  const data = await prisma.marketData.findMany({
    orderBy: { symbol: 'asc' }
  });
  
  return data.map(d => ({
    symbol: d.symbol,
    name: d.name,
    price: d.price,
    change24h: d.change24h,
    volume24h: d.volume24h ?? undefined,
    marketCap: d.marketCap ?? undefined
  }));
}

/**
 * Refresh market data - call this periodically
 */
export async function refreshMarketData(): Promise<CryptoQuote[]> {
  console.log('[MarketData] Refreshing market data...');
  const data = await fetchMarketData();
  console.log(`[MarketData] Updated ${data.length} assets`);
  return data;
}
