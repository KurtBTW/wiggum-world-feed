const CRYPTO_SYMBOLS = [
  { yahoo: 'BTC-USD', symbol: 'BTC', name: 'Bitcoin', coingecko: 'bitcoin' },
  { yahoo: 'ETH-USD', symbol: 'ETH', name: 'Ethereum', coingecko: 'ethereum' },
  { yahoo: 'SOL-USD', symbol: 'SOL', name: 'Solana', coingecko: 'solana' },
  { yahoo: 'XRP-USD', symbol: 'XRP', name: 'XRP', coingecko: 'ripple' },
  { yahoo: 'ADA-USD', symbol: 'ADA', name: 'Cardano', coingecko: 'cardano' },
  { yahoo: 'AVAX-USD', symbol: 'AVAX', name: 'Avalanche', coingecko: 'avalanche-2' },
  { yahoo: 'LINK-USD', symbol: 'LINK', name: 'Chainlink', coingecko: 'chainlink' },
  { yahoo: 'DOT-USD', symbol: 'DOT', name: 'Polkadot', coingecko: 'polkadot' },
  { yahoo: 'HYPE-USD', symbol: 'HYPE', name: 'Hyperliquid', coingecko: 'hyperliquid' },
  { yahoo: 'SUI20947-USD', symbol: 'SUI', name: 'Sui', coingecko: 'sui' },
];

const COMMODITY_SYMBOLS = [
  { symbol: 'GC=F', display: 'XAU', name: 'Gold' },
  { symbol: 'SI=F', display: 'XAG', name: 'Silver' },
  { symbol: 'HG=F', display: 'HG', name: 'Copper' },
  { symbol: 'CL=F', display: 'OIL', name: 'Crude Oil' },
  { symbol: 'URA', display: 'URA', name: 'Uranium ETF' },
];

export interface PriceData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  type: 'crypto' | 'commodity';
}

async function fetchCoinGeckoPrice(id: string): Promise<{ price: number; change24h: number } | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currency=usd&include_24hr_change=true`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data[id]) return null;
    return { price: data[id].usd, change24h: data[id].usd_24h_change || 0 };
  } catch {
    return null;
  }
}

export async function fetchCryptoPrices(): Promise<PriceData[]> {
  const results: PriceData[] = [];
  
  for (const crypto of CRYPTO_SYMBOLS) {
    let quote = await fetchYahooQuote(crypto.yahoo);
    
    if (!quote || quote.price === 0) {
      quote = await fetchCoinGeckoPrice(crypto.coingecko);
    }
    
    if (quote && quote.price > 0) {
      results.push({
        symbol: crypto.symbol,
        name: crypto.name,
        price: quote.price,
        change24h: quote.change24h,
        type: 'crypto',
      });
    }
  }
  
  return results;
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
      console.error(`Yahoo Finance error for ${symbol}:`, response.status);
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
  } catch (error) {
    console.error(`Failed to fetch ${symbol} from Yahoo:`, error);
    return null;
  }
}

export async function fetchCommodityPrices(): Promise<PriceData[]> {
  const results: PriceData[] = [];
  
  for (const commodity of COMMODITY_SYMBOLS) {
    const quote = await fetchYahooQuote(commodity.symbol);
    
    if (quote) {
      results.push({
        symbol: commodity.display,
        name: commodity.name,
        price: quote.price,
        change24h: quote.change24h,
        type: 'commodity',
      });
    }
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
