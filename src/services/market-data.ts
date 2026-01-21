// Market Data Service - Track S&P 500, Gold, BTC movements
import { prisma } from '@/lib/prisma';
import { getSourcesForCategory } from './config';

interface AssetData {
  asset: string;
  symbol: string;
  date: Date;
  openPrice: number;
  closePrice: number;
  dailyChange: number;
}

interface MarketMovementResult {
  asset: string;
  date: Date;
  dailyChange: number;
  possibleReasons: string[];
  triggered: boolean;
}

const THRESHOLD_PERCENT = 5;

/**
 * Fetch market data for all tracked assets
 * Uses Yahoo Finance API (free tier) or Alpha Vantage
 */
export async function fetchMarketData(): Promise<AssetData[]> {
  const sourceConfig = getSourcesForCategory('market_movements');
  const results: AssetData[] = [];
  
  // Use Yahoo Finance symbols
  const assets = sourceConfig?.dataProviders?.[0]?.assets || {
    SP500: '^GSPC',
    GOLD: 'GC=F',
    BTC: 'BTC-USD'
  };
  
  for (const [assetName, symbol] of Object.entries(assets)) {
    try {
      const data = await fetchYahooFinanceQuote(symbol as string);
      if (data) {
        results.push({
          asset: assetName,
          symbol: symbol as string,
          ...data
        });
      }
    } catch (error) {
      console.error(`[MarketData] Error fetching ${assetName}:`, error);
    }
  }
  
  return results;
}

/**
 * Fetch quote from Yahoo Finance
 */
async function fetchYahooFinanceQuote(symbol: string): Promise<Omit<AssetData, 'asset' | 'symbol'> | null> {
  try {
    // Yahoo Finance v8 API (unofficial but widely used)
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
    
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;
    
    if (!quotes || !timestamps || timestamps.length < 2) {
      return null;
    }
    
    // Get yesterday's and today's data
    const lastIndex = timestamps.length - 1;
    const prevIndex = lastIndex - 1;
    
    const openPrice = quotes.open?.[prevIndex] || quotes.close?.[prevIndex];
    const closePrice = quotes.close?.[lastIndex];
    
    if (!openPrice || !closePrice) {
      return null;
    }
    
    const dailyChange = ((closePrice - openPrice) / openPrice) * 100;
    
    return {
      date: new Date(timestamps[lastIndex] * 1000),
      openPrice,
      closePrice,
      dailyChange
    };
  } catch (error) {
    console.error(`[YahooFinance] Error fetching ${symbol}:`, error);
    return null;
  }
}

/**
 * Check for significant market movements (>= 5%)
 */
export async function checkMarketMovements(): Promise<MarketMovementResult[]> {
  const marketData = await fetchMarketData();
  const results: MarketMovementResult[] = [];
  
  for (const data of marketData) {
    const triggered = Math.abs(data.dailyChange) >= THRESHOLD_PERCENT;
    
    // Store in database
    const existing = await prisma.marketData.findFirst({
      where: {
        asset: data.asset,
        date: {
          gte: new Date(data.date.setHours(0, 0, 0, 0)),
          lt: new Date(data.date.setHours(23, 59, 59, 999))
        }
      }
    });
    
    if (!existing) {
      await prisma.marketData.create({
        data: {
          asset: data.asset,
          date: data.date,
          openPrice: data.openPrice,
          closePrice: data.closePrice,
          dailyChange: data.dailyChange
        }
      });
    }
    
    if (triggered) {
      // Generate possible reasons from news corpus
      const reasons = await generatePossibleReasons(data.asset, data.dailyChange);
      
      // Update with reasons
      if (existing) {
        await prisma.marketData.update({
          where: { id: existing.id },
          data: { possibleReasons: JSON.stringify(reasons) }
        });
      }
      
      results.push({
        asset: data.asset,
        date: data.date,
        dailyChange: data.dailyChange,
        possibleReasons: reasons,
        triggered: true
      });
    } else {
      results.push({
        asset: data.asset,
        date: data.date,
        dailyChange: data.dailyChange,
        possibleReasons: [],
        triggered: false
      });
    }
  }
  
  return results;
}

/**
 * Generate possible reasons for market movement
 * Pulls from news corpus and uses uncertainty labels
 */
async function generatePossibleReasons(asset: string, dailyChange: number): Promise<string[]> {
  const direction = dailyChange > 0 ? 'increase' : 'decrease';
  const reasons: string[] = [];
  
  // Get recent news items that might be relevant
  const keywords = getAssetKeywords(asset);
  const recentNews = await prisma.ingestedItem.findMany({
    where: {
      publishedAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000) // Last 48 hours
      },
      OR: keywords.map(kw => ({
        OR: [
          { title: { contains: kw } },
          { excerpt: { contains: kw } }
        ]
      }))
    },
    take: 10,
    orderBy: { publishedAt: 'desc' }
  });
  
  // Generate possible drivers with uncertainty labels
  if (recentNews.length > 0) {
    const newsTopics = recentNews.map(n => n.title).slice(0, 3);
    for (const topic of newsTopics) {
      reasons.push(`Possible driver (not certain): ${extractKeyPhrase(topic)}`);
    }
  }
  
  // Add general market factors
  if (asset === 'SP500') {
    reasons.push(`Possible driver (not certain): Broader market sentiment and economic indicators`);
  } else if (asset === 'GOLD') {
    reasons.push(`Possible driver (not certain): Safe-haven demand or currency fluctuations`);
  } else if (asset === 'BTC') {
    reasons.push(`Possible driver (not certain): Crypto market sentiment or regulatory developments`);
  }
  
  return reasons.slice(0, 4); // Max 4 reasons
}

/**
 * Get keywords for an asset
 */
function getAssetKeywords(asset: string): string[] {
  switch (asset) {
    case 'SP500':
      return ['S&P', 'stock market', 'Wall Street', 'Fed', 'interest rate', 'economy'];
    case 'GOLD':
      return ['gold', 'precious metal', 'safe haven', 'inflation', 'dollar'];
    case 'BTC':
      return ['bitcoin', 'BTC', 'crypto', 'cryptocurrency', 'blockchain'];
    default:
      return [];
  }
}

/**
 * Extract key phrase from a title
 */
function extractKeyPhrase(title: string): string {
  // Clean and truncate
  return title
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 80);
}

/**
 * Get recent market movements for display
 */
export async function getRecentMarketMovements(days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return prisma.marketData.findMany({
    where: {
      date: { gte: since },
      OR: [
        { dailyChange: { gte: THRESHOLD_PERCENT } },
        { dailyChange: { lte: -THRESHOLD_PERCENT } }
      ]
    },
    orderBy: { date: 'desc' }
  });
}
