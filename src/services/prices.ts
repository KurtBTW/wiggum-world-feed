const CRYPTO_IDS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'hyperliquid', symbol: 'HYPE', name: 'Hyperliquid' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'sui', symbol: 'SUI', name: 'Sui' },
];

const COMMODITY_SYMBOLS = [
  { symbol: 'GC=F', display: 'XAU', name: 'Gold' },
  { symbol: 'SI=F', display: 'XAG', name: 'Silver' },
  { symbol: 'CL=F', display: 'OIL', name: 'Crude Oil' },
];

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: 'crypto' | 'commodity';
}

export async function fetchCryptoPrices(): Promise<PriceData[]> {
  try {
    const ids = CRYPTO_IDS.map(c => c.id).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { 
        next: { revalidate: 60 },
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (!res.ok) {
      console.error('CoinGecko API error:', res.status);
      return [];
    }
    
    const data = await res.json();
    const results: PriceData[] = [];
    
    for (const crypto of CRYPTO_IDS) {
      const priceData = data[crypto.id];
      if (priceData && priceData.usd > 0) {
        results.push({
          symbol: crypto.symbol,
          name: crypto.name,
          price: priceData.usd,
          change24h: priceData.usd_24h_change || 0,
          type: 'crypto',
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return [];
  }
}

async function fetchYahooQuote(symbol: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=2d&interval=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      next: { revalidate: 300 }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) return null;
    
    const meta = result.meta;
    const quotes = result.indicators?.quote?.[0];
    const timestamps = result.timestamp;
    
    if (!meta || !quotes || !timestamps || timestamps.length < 2) {
      return null;
    }
    
    const price = meta.regularMarketPrice || quotes.close?.[quotes.close.length - 1];
    const lastIndex = timestamps.length - 1;
    const prevIndex = lastIndex - 1;
    const prevClose = quotes.close?.[prevIndex];
    const currentClose = quotes.close?.[lastIndex];
    
    if (!price || !prevClose || !currentClose) {
      return null;
    }
    
    const change24h = ((currentClose - prevClose) / prevClose) * 100;
    
    return { price, change24h };
  } catch {
    return null;
  }
}

export async function fetchCommodityPrices(): Promise<PriceData[]> {
  const results: PriceData[] = [];
  
  const promises = COMMODITY_SYMBOLS.map(async (commodity) => {
    const quote = await fetchYahooQuote(commodity.symbol);
    if (quote) {
      return {
        symbol: commodity.display,
        name: commodity.name,
        price: quote.price,
        change24h: quote.change24h,
        type: 'commodity' as const,
      };
    }
    return null;
  });
  
  const settled = await Promise.all(promises);
  for (const result of settled) {
    if (result) results.push(result);
  }
  
  return results;
}

export async function fetchAllPrices(): Promise<PriceData[]> {
  const [crypto, commodities] = await Promise.all([
    fetchCryptoPrices(),
    fetchCommodityPrices(),
  ]);

  return [...crypto, ...commodities];
}
