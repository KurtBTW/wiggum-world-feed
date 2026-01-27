'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Loader2, Globe, Clock, X,
  ExternalLink, Info, BarChart3, Newspaper
} from 'lucide-react';
import { 
  createChart, 
  ColorType, 
  ISeriesApi,  
  CandlestickData, 
  Time,
  CandlestickSeries
} from 'lightweight-charts';
import { CompactTweetCard, Tweet } from '@/components/TweetCard';
import { TickerPriceData } from './PriceTicker';
import { NewsCard, NewsItem } from '@/components/NewsCard';

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

interface TickerAssetModalProps {
  asset: TickerPriceData;
  tweets?: Tweet[];
  onClose: () => void;
}

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

const ASSET_INFO: Record<string, { description: string; website?: string; twitter?: string; explorer?: string }> = {
  BTC: {
    description: 'Bitcoin is the first decentralized cryptocurrency, created in 2009 by Satoshi Nakamoto. It operates on a peer-to-peer network using blockchain technology.',
    website: 'https://bitcoin.org',
    twitter: '@Bitcoin',
    explorer: 'https://blockchair.com/bitcoin',
  },
  ETH: {
    description: 'Ethereum is a decentralized blockchain platform that enables smart contracts and decentralized applications (dApps). It\'s the second-largest cryptocurrency by market cap.',
    website: 'https://ethereum.org',
    twitter: '@ethereum',
    explorer: 'https://etherscan.io',
  },
  SOL: {
    description: 'Solana is a high-performance blockchain supporting smart contracts and decentralized applications. Known for high throughput and low transaction costs.',
    website: 'https://solana.com',
    twitter: '@solana',
    explorer: 'https://solscan.io',
  },
  HYPE: {
    description: 'Native token of the Hyperliquid L1 blockchain. Hyperliquid is a high-performance decentralized exchange with on-chain order books and instant finality.',
    website: 'https://hyperfoundation.org',
    twitter: '@HyperliquidX',
    explorer: 'https://purrsec.com',
  },
  XRP: {
    description: 'XRP is the native cryptocurrency of the XRP Ledger, designed for fast, low-cost international payments and remittances.',
    website: 'https://xrpl.org',
    twitter: '@Ripple',
    explorer: 'https://xrpscan.com',
  },
  ADA: {
    description: 'Cardano is a proof-of-stake blockchain platform focused on sustainability, scalability, and transparency. ADA is its native cryptocurrency.',
    website: 'https://cardano.org',
    twitter: '@Cardano',
    explorer: 'https://cardanoscan.io',
  },
  AVAX: {
    description: 'Avalanche is a layer-1 blockchain platform for decentralized applications and custom blockchain networks. AVAX is used for fees and staking.',
    website: 'https://avax.network',
    twitter: '@avaboratory',
    explorer: 'https://snowtrace.io',
  },
  LINK: {
    description: 'Chainlink is a decentralized oracle network that enables smart contracts to securely interact with real-world data, APIs, and payment systems.',
    website: 'https://chain.link',
    twitter: '@chainlink',
    explorer: 'https://etherscan.io/token/0x514910771af9ca656af840dff83e8264ecf986ca',
  },
  DOT: {
    description: 'Polkadot is a multi-chain protocol that enables cross-blockchain transfers of any type of data or asset. DOT is used for governance and staking.',
    website: 'https://polkadot.network',
    twitter: '@Polkadot',
    explorer: 'https://polkascan.io',
  },
  SUI: {
    description: 'Sui is a layer-1 blockchain designed for high throughput and low latency, using a novel consensus mechanism and the Move programming language.',
    website: 'https://sui.io',
    twitter: '@SuiNetwork',
    explorer: 'https://suiscan.xyz',
  },
  XAU: {
    description: 'Gold (XAU) is a precious metal that has been used as a store of value for thousands of years. It\'s often seen as a hedge against inflation and economic uncertainty.',
    website: 'https://www.gold.org',
  },
  XAG: {
    description: 'Silver (XAG) is a precious metal used in jewelry, electronics, and as an investment. It has both industrial and monetary value.',
    website: 'https://www.silver.org',
  },
  HG: {
    description: 'Copper is an industrial metal essential for electrical wiring, construction, and electronics. It\'s often seen as a barometer of global economic health.',
  },
  OIL: {
    description: 'Crude Oil (WTI) is one of the most traded commodities globally. It\'s used as a benchmark for oil pricing and is essential for transportation and manufacturing.',
  },
  URA: {
    description: 'URA is an ETF that tracks uranium mining companies. Uranium is used as fuel for nuclear power plants and is seeing increased demand for clean energy.',
  },
};

function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

function formatSupply(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(0);
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (price >= 1) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 0.01) return price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 6 });
}

export function TickerAssetModal({ asset, tweets = [], onClose }: TickerAssetModalProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'news' | 'info'>('chart');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [chartLoading, setChartLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const assetInfo = ASSET_INFO[asset.symbol] || { description: `${asset.name} price data.` };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const fetchMarketData = useCallback(async () => {
    try {
      const symbolMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'HYPE': 'hype',
        'XRP': 'ripple',
        'ADA': 'cardano',
        'AVAX': 'avalanche',
        'LINK': 'chainlink',
        'DOT': 'polkadot',
        'SUI': 'sui',
      };
      
      const id = symbolMap[asset.symbol] || asset.symbol.toLowerCase();
      const res = await fetch(`/api/prices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  }, [asset.symbol]);

  useEffect(() => {
    if (asset.type === 'crypto') {
      fetchMarketData();
    } else {
      setLoading(false);
    }
  }, [fetchMarketData, asset.type]);

  useEffect(() => {
    if (activeTab !== 'chart' || !chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#71717a',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(80, 226, 195, 0.3)', width: 1, style: 2 },
        horzLine: { color: 'rgba(80, 226, 195, 0.3)', width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)', timeVisible: true, secondsVisible: false },
      handleScale: false,
      handleScroll: false,
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'chart' || !seriesRef.current) return;

    async function fetchChartData() {
      setChartLoading(true);
      try {
        const res = await fetch(`/api/prices/history?symbol=${asset.symbol}&timeframe=${timeframe}`);
        const data = await res.json();
        
        if (data.data && data.data.length > 0 && seriesRef.current) {
          const candlestickData: CandlestickData<Time>[] = data.data.map((point: { time: number; open: number; high: number; low: number; close: number }) => ({
            time: point.time as Time,
            open: point.open,
            high: point.high,
            low: point.low,
            close: point.close,
          }));
          seriesRef.current.setData(candlestickData);
        }
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
      } finally {
        setChartLoading(false);
      }
    }

    fetchChartData();
  }, [asset.symbol, timeframe, activeTab]);

  useEffect(() => {
    if (activeTab !== 'news') return;

    async function fetchNews() {
      setNewsLoading(true);
      try {
        const res = await fetch(`/api/news/${asset.symbol}`);
        const data = await res.json();
        setNews(data.map((item: NewsItem) => ({
          ...item,
          publishedAt: new Date(item.publishedAt),
        })));
      } catch (error) {
        console.error('Failed to fetch news:', error);
        setNews([]);
      } finally {
        setNewsLoading(false);
      }
    }

    fetchNews();
  }, [asset.symbol, activeTab]);

  const isPositive = asset.change24h >= 0;
  const hasMarketData = marketData && marketData.price > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f0f0f] border border-white/[0.1] rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              asset.type === 'crypto' 
                ? 'bg-gradient-to-br from-[#50e2c3] to-[#3fcbac]' 
                : 'bg-gradient-to-br from-[#fbbf24] to-[#f59e0b]'
            }`}>
              <span className="text-black font-bold text-sm">{asset.symbol}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{asset.symbol}</h1>
              <p className="text-sm text-zinc-500">{asset.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-4xl font-bold text-white">
                ${formatPrice(asset.price)}
              </span>
              <span className={`flex items-center gap-1 text-lg font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {Math.abs(asset.change24h).toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-zinc-500">24h change</p>
          </div>

          {hasMarketData && (
            <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">Market Cap</p>
                <p className="text-sm font-semibold text-white">{formatLargeNumber(marketData.marketCap)}</p>
              </div>
              <div className="text-center border-l border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">24H Volume</p>
                <p className="text-sm font-semibold text-white">{formatLargeNumber(marketData.volume24h)}</p>
              </div>
              <div className="text-center border-l border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Circ Supply</p>
                <p className="text-sm font-semibold text-white">{formatSupply(marketData.circulatingSupply)}</p>
              </div>
              <div className="text-center border-l border-white/[0.06]">
                <p className="text-xs text-zinc-500 mb-1">Total Supply</p>
                <p className="text-sm font-semibold text-white">{formatSupply(marketData.totalSupply)}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06]">
            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'chart' 
                  ? 'text-[#50e2c3] border-b-2 border-[#50e2c3]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Chart
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'news' 
                  ? 'text-[#50e2c3] border-b-2 border-[#50e2c3]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" />
              News
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'info' 
                  ? 'text-[#50e2c3] border-b-2 border-[#50e2c3]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>

          {activeTab === 'chart' && (
            <div>
              <div className="flex gap-2 mb-4">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      timeframe === tf
                        ? 'bg-[#50e2c3] text-black'
                        : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="relative h-[300px] bg-white/[0.01] rounded-xl border border-white/[0.06] overflow-hidden">
                {chartLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 z-10">
                    <Loader2 className="w-6 h-6 text-[#50e2c3] animate-spin" />
                  </div>
                )}
                <div ref={chartContainerRef} className="w-full h-full" />
              </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-2">
              {newsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#50e2c3] animate-spin" />
                </div>
              ) : news.length > 0 ? (
                news.map((item) => (
                  <NewsCard key={item.id} news={item} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Newspaper className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500">No news for {asset.symbol}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-2">About {asset.name}</h3>
                <p className="text-sm text-zinc-400">{assetInfo.description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {assetInfo.website && (
                  <a
                    href={assetInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {assetInfo.twitter && (
                  <a
                    href={`https://twitter.com/${assetInfo.twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    {assetInfo.twitter}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {assetInfo.explorer && (
                  <a
                    href={assetInfo.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {hasMarketData && marketData.ath > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-zinc-500 mb-1">All-Time High</p>
                    <p className="text-lg font-semibold text-white">${formatPrice(marketData.ath)}</p>
                    {marketData.athDate && (
                      <p className="text-xs text-zinc-600">{new Date(marketData.athDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                    <p className="text-xs text-zinc-500 mb-1">All-Time Low</p>
                    <p className="text-lg font-semibold text-white">${formatPrice(marketData.atl)}</p>
                    {marketData.atlDate && (
                      <p className="text-xs text-zinc-600">{new Date(marketData.atlDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between text-xs text-zinc-600">
            {assetInfo.website && (
              <a
                href={assetInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-zinc-400 transition-colors"
              >
                <Globe className="w-3 h-3" />
                {assetInfo.website.replace('https://', '')}
              </a>
            )}
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated live
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
