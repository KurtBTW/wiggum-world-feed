'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, Loader2, Globe, Clock,
  ExternalLink, Wallet, Info, BarChart3, Newspaper
} from 'lucide-react';
import { 
  createChart, 
  ColorType, 
  ISeriesApi,  
  CandlestickData, 
  Time,
  CandlestickSeries
} from 'lightweight-charts';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { CompactTweetCard, Tweet } from '@/components/TweetCard';
import { LoopingDeposit } from '@/components/LoopingDeposit';
import { KinetiqDeposit } from '@/components/KinetiqDeposit';
import { LiminalDeposit } from '@/components/LiminalDeposit';
import { HypurrFiDeposit } from '@/components/HypurrFiDeposit';

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

interface AssetConfig {
  id: string;
  symbol: string;
  name: string;
  type: 'native' | 'protocol';
  color: string;
  gradient: string;
  icon: React.ReactNode;
  imageUrl?: string;
  description: string;
  website?: string;
  twitter?: string;
  explorer?: string;
  apy?: number;
  tvl?: number;
  depositAsset?: string;
  noChart?: boolean;
  externalUrl?: string;
}

interface AssetDetailProps {
  asset: AssetConfig;
  tweets?: Tweet[];
  onDepositSuccess?: () => void;
}

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '1Y', 'ALL'] as const;

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

export function AssetDetail({ asset, tweets = [], onDepositSuccess }: AssetDetailProps) {
  const { isConnected } = useAccount();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chart' | 'news' | 'info'>(asset.noChart ? 'info' : 'chart');
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [chartLoading, setChartLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch(`/api/prices/${asset.id}`);
      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
    }
  }, [asset.id]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

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
        const chartSymbol = asset.type === 'protocol' ? 'hype' : asset.id;
        const res = await fetch(`/api/prices/history?symbol=${chartSymbol.toUpperCase()}&timeframe=${timeframe}`);
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
  }, [asset.id, asset.type, timeframe, activeTab]);

  const handleDepositSuccess = useCallback(() => {
    setRefreshKey(k => k + 1);
    onDepositSuccess?.();
  }, [onDepositSuccess]);

  const filteredTweets = tweets.filter(tweet => {
    const searchTerms = [asset.symbol.toLowerCase(), asset.id.toLowerCase()];
    const text = tweet.text.toLowerCase();
    return searchTerms.some(term => text.includes(term));
  });

  const isPositive = marketData ? marketData.change24h >= 0 : false;
  const hasMarketData = marketData && marketData.price > 0;
  const lastUpdated = marketData?.lastUpdated ? new Date(marketData.lastUpdated) : new Date();

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {asset.imageUrl ? (
            <img src={asset.imageUrl} alt={asset.name} className="w-14 h-14 rounded-xl object-contain" />
          ) : (
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${asset.gradient} flex items-center justify-center`}>
              {asset.icon}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{asset.symbol}</h1>
            <p className="text-sm text-zinc-500">{asset.name}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#50e2c3] animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-4xl font-bold text-white">
                  {hasMarketData ? `$${formatPrice(marketData.price)}` : '—'}
                </span>
                {hasMarketData && (
                  <span className={`flex items-center gap-1 text-lg font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {Math.abs(marketData.change24h).toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                Updated: {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} EST • Today
              </p>
            </div>

            {hasMarketData && !asset.noChart && (
              <div className="grid grid-cols-5 gap-2 mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">TVL</p>
                  <p className="text-sm font-semibold text-white">{asset.tvl ? formatLargeNumber(asset.tvl) : formatLargeNumber(marketData.marketCap)}</p>
                </div>
                <div className="text-center border-l border-white/[0.06]">
                  <p className="text-xs text-zinc-500 mb-1">24H Volume</p>
                  <p className="text-sm font-semibold text-white">{formatLargeNumber(marketData.volume24h)}</p>
                </div>
                <div className="text-center border-l border-white/[0.06]">
                  <p className="text-xs text-zinc-500 mb-1">FDV</p>
                  <p className="text-sm font-semibold text-white">{formatLargeNumber(marketData.fdv)}</p>
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

            {asset.noChart && asset.tvl !== undefined && asset.tvl > 0 && (
              <div className="mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Total Value Locked</p>
                  <p className="text-3xl font-bold text-white">{formatLargeNumber(asset.tvl)}</p>
                </div>
              </div>
            )}

            {asset.type === 'protocol' && (
              <div className="mb-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">APY</p>
                    <p className="text-2xl font-bold text-[#50e2c3]">
                      {asset.apy && asset.apy > 0 ? `${asset.apy.toFixed(2)}%` : '—'}
                    </p>
                  </div>
                  {asset.tvl !== undefined && asset.tvl > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">TVL</p>
                      <p className="text-lg font-semibold text-white">{formatLargeNumber(asset.tvl)}</p>
                    </div>
                  )}
                  {asset.depositAsset && (
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 mb-1">Deposit</p>
                      <p className="text-sm font-medium text-white">{asset.depositAsset}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-1 mb-4 border-b border-white/[0.06]">
              {!asset.noChart && (
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
              )}
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

            {activeTab === 'chart' && !asset.noChart && (
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
                {filteredTweets.length > 0 ? (
                  filteredTweets.slice(0, 10).map((tweet) => (
                    <CompactTweetCard key={tweet.id} tweet={tweet} />
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
                  <p className="text-sm text-zinc-400">{asset.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {asset.website && (
                    <a
                      href={asset.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {asset.twitter && (
                    <a
                      href={`https://twitter.com/${asset.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] rounded-lg border border-white/[0.06] text-sm text-zinc-400 hover:text-white hover:border-white/[0.12] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      {asset.twitter}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {asset.explorer && (
                    <a
                      href={asset.explorer}
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

            {asset.type === 'protocol' && (
              <div className="mt-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                <h3 className="text-sm font-medium text-white mb-4">Deposit</h3>
                {asset.externalUrl ? (
                  <div className="space-y-4">
                    <p className="text-sm text-zinc-400">
                      Deposit directly on the {asset.name} platform.
                    </p>
                    <a
                      href={asset.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#F7931A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Open {asset.name} App
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : isConnected ? (
                  <div>
                    {asset.id === 'lhype' && (
                      <LoopingDeposit key={`looping-${refreshKey}`} onSuccess={handleDepositSuccess} />
                    )}
                    {asset.id === 'khype' && (
                      <KinetiqDeposit key={`kinetiq-${refreshKey}`} onSuccess={handleDepositSuccess} />
                    )}
                    {(asset.id === 'xhype' || asset.id === 'xbtc') && (
                      <LiminalDeposit key={`liminal-${refreshKey}`} onSuccess={handleDepositSuccess} />
                    )}
                    {asset.id === 'hypurrfi' && (
                      <HypurrFiDeposit key={`hypurrfi-${refreshKey}`} onSuccess={handleDepositSuccess} />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Wallet className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400 text-sm mb-3">Connect wallet to deposit</p>
                    <ConnectButton />
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between text-xs text-zinc-600">
              {asset.website && (
                <a
                  href={asset.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-zinc-400 transition-colors"
                >
                  <Globe className="w-3 h-3" />
                  {asset.website.replace('https://', '')}
                </a>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated live
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
