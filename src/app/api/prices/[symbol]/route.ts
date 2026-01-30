import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 60;

const ASSET_CONFIG: Record<string, { coingecko?: string; name: string; type: 'crypto' | 'protocol' }> = {
  hype: { coingecko: 'hyperliquid', name: 'Hyperliquid', type: 'crypto' },
  btc: { coingecko: 'bitcoin', name: 'Bitcoin', type: 'crypto' },
  eth: { coingecko: 'ethereum', name: 'Ethereum', type: 'crypto' },
  sol: { coingecko: 'solana', name: 'Solana', type: 'crypto' },
  xrp: { coingecko: 'ripple', name: 'XRP', type: 'crypto' },
  ada: { coingecko: 'cardano', name: 'Cardano', type: 'crypto' },
  avax: { coingecko: 'avalanche-2', name: 'Avalanche', type: 'crypto' },
  link: { coingecko: 'chainlink', name: 'Chainlink', type: 'crypto' },
  dot: { coingecko: 'polkadot', name: 'Polkadot', type: 'crypto' },
  sui: { coingecko: 'sui', name: 'Sui', type: 'crypto' },
  xhype: { name: 'Liminal xHYPE', type: 'protocol' },
  khype: { name: 'Kinetiq', type: 'protocol' },
  lhype: { name: 'Looping Collective', type: 'protocol' },
  ktables: { name: 'ktables', type: 'protocol' },
  xbtc: { name: 'Liminal xBTC', type: 'protocol' },
};

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change24hUsd: number;
  marketCap: number;
  volume24h: number;
  fdv: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  lastUpdated: string;
}

async function fetchCoinGeckoMarketData(coingeckoId: string): Promise<MarketData | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 60 } }
    );
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const market = data.market_data;
    
    return {
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      price: market.current_price?.usd || 0,
      change24h: market.price_change_percentage_24h || 0,
      change24hUsd: market.price_change_24h || 0,
      marketCap: market.market_cap?.usd || 0,
      volume24h: market.total_volume?.usd || 0,
      fdv: market.fully_diluted_valuation?.usd || 0,
      circulatingSupply: market.circulating_supply || 0,
      totalSupply: market.total_supply || 0,
      maxSupply: market.max_supply,
      ath: market.ath?.usd || 0,
      athDate: market.ath_date?.usd || '',
      atl: market.atl?.usd || 0,
      atlDate: market.atl_date?.usd || '',
      lastUpdated: data.last_updated || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  const symbolLower = symbol.toLowerCase();
  const config = ASSET_CONFIG[symbolLower];
  
  if (!config) {
    return NextResponse.json({ error: 'Unknown asset' }, { status: 404 });
  }
  
  if (config.coingecko) {
    const marketData = await fetchCoinGeckoMarketData(config.coingecko);
    
    if (marketData) {
      return NextResponse.json(marketData);
    }
  }
  
  return NextResponse.json({
    symbol: symbol.toUpperCase(),
    name: config.name,
    price: 0,
    change24h: 0,
    change24hUsd: 0,
    marketCap: 0,
    volume24h: 0,
    fdv: 0,
    circulatingSupply: 0,
    totalSupply: 0,
    maxSupply: null,
    ath: 0,
    athDate: '',
    atl: 0,
    atlDate: '',
    lastUpdated: new Date().toISOString(),
  });
}
