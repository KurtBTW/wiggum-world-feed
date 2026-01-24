import { NextRequest, NextResponse } from 'next/server';

const SYMBOL_MAP: Record<string, { yahoo: string; coingecko?: string }> = {
  BTC: { yahoo: 'BTC-USD', coingecko: 'bitcoin' },
  ETH: { yahoo: 'ETH-USD', coingecko: 'ethereum' },
  SOL: { yahoo: 'SOL-USD', coingecko: 'solana' },
  XRP: { yahoo: 'XRP-USD', coingecko: 'ripple' },
  ADA: { yahoo: 'ADA-USD', coingecko: 'cardano' },
  AVAX: { yahoo: 'AVAX-USD', coingecko: 'avalanche-2' },
  LINK: { yahoo: 'LINK-USD', coingecko: 'chainlink' },
  DOT: { yahoo: 'DOT-USD', coingecko: 'polkadot' },
  HYPE: { yahoo: 'HYPE-USD', coingecko: 'hyperliquid' },
  SUI: { yahoo: 'SUI20947-USD', coingecko: 'sui' },
  XAU: { yahoo: 'GC=F' },
  XAG: { yahoo: 'SI=F' },
  HG: { yahoo: 'HG=F' },
  OIL: { yahoo: 'CL=F' },
  URA: { yahoo: 'URA' },
};

const TIMEFRAME_CONFIG: Record<string, { range: string; interval: string; coingeckoDays: string }> = {
  '1D': { range: '1d', interval: '5m', coingeckoDays: '1' },
  '1W': { range: '5d', interval: '15m', coingeckoDays: '7' },
  '1M': { range: '1mo', interval: '1h', coingeckoDays: '30' },
  '3M': { range: '3mo', interval: '1d', coingeckoDays: '90' },
  '1Y': { range: '1y', interval: '1d', coingeckoDays: '365' },
  'ALL': { range: '5y', interval: '1wk', coingeckoDays: 'max' },
};

interface ChartDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

async function fetchYahooHistory(symbol: string, range: string, interval: string): Promise<ChartDataPoint[]> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result?.timestamp || !result?.indicators?.quote?.[0]) return [];
    
    const { timestamp } = result;
    const quote = result.indicators.quote[0];
    
    const points: ChartDataPoint[] = [];
    
    for (let i = 0; i < timestamp.length; i++) {
      if (quote.open?.[i] && quote.high?.[i] && quote.low?.[i] && quote.close?.[i]) {
        points.push({
          time: timestamp[i],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
        });
      }
    }
    
    return points;
  } catch (error) {
    console.error(`Failed to fetch Yahoo history for ${symbol}:`, error);
    return [];
  }
}

async function fetchCoinGeckoHistory(id: string, days: string): Promise<ChartDataPoint[]> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${id}/ohlc?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.map((point: number[]) => ({
      time: Math.floor(point[0] / 1000),
      open: point[1],
      high: point[2],
      low: point[3],
      close: point[4],
    }));
  } catch (error) {
    console.error(`Failed to fetch CoinGecko history for ${id}:`, error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe') || '1D';

  if (!symbol || !SYMBOL_MAP[symbol]) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }

  const config = TIMEFRAME_CONFIG[timeframe];
  if (!config) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const symbolConfig = SYMBOL_MAP[symbol];
  
  let data = await fetchYahooHistory(symbolConfig.yahoo, config.range, config.interval);
  
  if (data.length === 0 && symbolConfig.coingecko) {
    data = await fetchCoinGeckoHistory(symbolConfig.coingecko, config.coingeckoDays);
  }

  return NextResponse.json({ 
    symbol, 
    timeframe,
    data,
  });
}
