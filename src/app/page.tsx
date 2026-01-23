'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, ExternalLink, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { ArticleSummary } from '@/components/ArticleSummary';
import { ChatWidget } from '@/components/ChatWidget';
import { Watchlist } from '@/components/Watchlist';
import type { TileSnapshot, TileItem, Category } from '@/types';

// HypurrFi brand color
const TEAL = '#50e2c3';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'defi_alpha', label: 'DeFi Alpha' },
  { id: 'token_launches', label: 'Token Launches' },
  { id: 'security_alerts', label: 'Security' },
  { id: 'ai_frontier', label: 'AI Frontier' },
];

// Assets for the ticker
const TICKER_ASSETS = [
  { symbol: 'HYPE', name: 'Hyperliquid', coingeckoId: 'hyperliquid' },
  { symbol: 'BTC', name: 'Bitcoin', coingeckoId: 'bitcoin' },
  { symbol: 'ETH', name: 'Ethereum', coingeckoId: 'ethereum' },
  { symbol: 'XMR', name: 'Monero', coingeckoId: 'monero' },
  { symbol: 'GOLD', name: 'Gold', yahooSymbol: 'GC=F' },
  { symbol: 'SILVER', name: 'Silver', yahooSymbol: 'SI=F' },
  { symbol: 'URANIUM', name: 'Uranium', yahooSymbol: 'URA' },
  { symbol: 'COPPER', name: 'Copper', yahooSymbol: 'HG=F' },
];

// HyperEVM Protocols - Featured
const HYPEREVM_PROTOCOLS = [
  { name: 'Hyperliquid', url: 'https://app.hyperliquid.xyz/trade', description: 'Perpetuals Exchange' },
  { name: 'HypurrFi', url: 'https://app.hypurr.fi/', description: 'Lending Platform' },
  { name: 'HyperSwap', url: 'https://app.hyperswap.exchange/#/swap', description: 'Exchange' },
  { name: 'PRJX', url: 'https://www.prjx.com/', description: 'Exchange' },
  { name: 'Kinetiq', url: 'https://kinetiq.xyz/', description: 'LST' },
  { name: 'Liminal', url: 'https://liminal.money/app/tokenized', description: 'Tokenized Strategies' },
  { name: 'HyperWave', url: 'https://app.hyperwavefi.xyz/assets/hwhlp', description: 'Tokenized Strategies' },
];

// Keywords that indicate major news for HypurrFi users
const MAJOR_NEWS_KEYWORDS = [
  'hyperliquid', 'hype', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol',
  'billion', 'million', 'crash', 'surge', 'hack', 'exploit', 'breaking',
  'gpt-5', 'gpt-6', 'claude', 'gemini', 'openai', 'anthropic', 'regulation',
  'sec', 'etf', 'approval', 'blackrock', 'record', 'all-time'
];

interface TickerPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export default function Home() {
  const [tiles, setTiles] = useState<Record<Category, TileSnapshot | null>>({} as Record<Category, TileSnapshot | null>);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tickerPrices, setTickerPrices] = useState<TickerPrice[]>([]);
  const [categoryItems, setCategoryItems] = useState<Record<Category, TileItem[]>>({} as Record<Category, TileItem[]>);
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  useEffect(() => {
    fetchTiles();
    fetchTickerPrices();
    const tilesInterval = setInterval(fetchTiles, 5 * 60 * 1000);
    const tickerInterval = setInterval(fetchTickerPrices, 60 * 1000); // Update prices every minute
    return () => {
      clearInterval(tilesInterval);
      clearInterval(tickerInterval);
    };
  }, []);

  // Fetch more items when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchCategoryItems(selectedCategory);
    }
  }, [selectedCategory]);

  const fetchTiles = useCallback(async () => {
    try {
      const res = await fetch('/api/tiles');
      const data = await res.json();
      if (data.tiles) {
        setTiles(data.tiles);
        setLastUpdated(new Date(data.lastUpdated));
      }
    } catch (error) {
      console.error('Failed to fetch tiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTickerPrices = async () => {
    try {
      // Fetch crypto prices from CoinGecko
      const cryptoIds = TICKER_ASSETS.filter(a => a.coingeckoId).map(a => a.coingeckoId).join(',');
      const cryptoRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoIds}&vs_currencies=usd&include_24hr_change=true`
      );
      const cryptoData = await cryptoRes.json();

      const prices: TickerPrice[] = TICKER_ASSETS.map(asset => {
        if (asset.coingeckoId && cryptoData[asset.coingeckoId]) {
          return {
            symbol: asset.symbol,
            name: asset.name,
            price: cryptoData[asset.coingeckoId].usd,
            change24h: cryptoData[asset.coingeckoId].usd_24h_change || 0,
          };
        }
        // Fallback prices for commodities (would need a real API in production)
        const commodityPrices: Record<string, { price: number; change: number }> = {
          'GOLD': { price: 2756.40, change: 0.45 },
          'SILVER': { price: 30.82, change: 1.23 },
          'URANIUM': { price: 23.45, change: -0.87 },
          'COPPER': { price: 4.12, change: 0.32 },
        };
        const commodity = commodityPrices[asset.symbol];
        return {
          symbol: asset.symbol,
          name: asset.name,
          price: commodity?.price || 0,
          change24h: commodity?.change || 0,
        };
      });

      setTickerPrices(prices);
    } catch (error) {
      console.error('Failed to fetch ticker prices:', error);
      // Set fallback prices on error
      setTickerPrices(TICKER_ASSETS.map(asset => ({
        symbol: asset.symbol,
        name: asset.name,
        price: 0,
        change24h: 0,
      })));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/tiles', { method: 'POST' });
      const data = await res.json();
      if (data.tiles) {
        setTiles(data.tiles);
        setLastUpdated(new Date(data.lastUpdated));
      }
      // Also refresh current category if not on 'all'
      if (selectedCategory !== 'all') {
        await fetchCategoryItems(selectedCategory);
      }
    } catch (error) {
      console.error('Failed to refresh tiles:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchCategoryItems = async (category: Category) => {
    // Don't refetch if we already have items for this category
    if (categoryItems[category]?.length > 0) return;
    
    setIsCategoryLoading(true);
    try {
      const res = await fetch(`/api/tiles/${category}?limit=30`);
      const data = await res.json();
      if (data.items) {
        setCategoryItems(prev => ({
          ...prev,
          [category]: data.items
        }));
      }
    } catch (error) {
      console.error(`Failed to fetch ${category} items:`, error);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  // Get all items across categories for relevancy scoring
  const getAllItems = (): (TileItem & { category: Category })[] => {
    const allItems: (TileItem & { category: Category })[] = [];
    for (const category of CATEGORIES) {
      const tile = tiles[category.id];
      if (tile?.items) {
        tile.items.forEach(item => {
          allItems.push({ ...item, category: category.id });
        });
      }
    }
    return allItems;
  };

  // Score an item for relevancy to HypurrFi users
  const getRelevancyScore = (item: TileItem): number => {
    const text = `${item.calmHeadline} ${item.calmSummary || ''} ${item.originalTitle || ''}`.toLowerCase();
    let score = 0;
    
    for (const keyword of MAJOR_NEWS_KEYWORDS) {
      if (text.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // Boost recent items
    const hoursAgo = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursAgo < 2) score += 20;
    else if (hoursAgo < 6) score += 10;
    
    // Boost items with images
    if (item.imageUrl) score += 5;
    
    return score;
  };

  // Get hero story (highest relevancy score)
  const getHeroStory = (): (TileItem & { category: Category }) | null => {
    const allItems = getAllItems();
    if (allItems.length === 0) return null;
    
    let heroItem = allItems[0];
    let maxScore = getRelevancyScore(heroItem);
    
    for (const item of allItems) {
      const score = getRelevancyScore(item);
      if (score > maxScore) {
        maxScore = score;
        heroItem = item;
      }
    }
    
    return heroItem;
  };

  // Get items for current view
  const getCurrentItems = (): (TileItem & { category: Category })[] => {
    if (selectedCategory === 'all') {
      const hero = getHeroStory();
      return getAllItems()
        .filter(item => item.id !== hero?.id)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 12);
    }
    
    // Use expanded category items if available, otherwise fall back to tile items
    const expandedItems = categoryItems[selectedCategory];
    if (expandedItems && expandedItems.length > 0) {
      return expandedItems.map(item => ({ ...item, category: selectedCategory }));
    }
    
    const tile = tiles[selectedCategory];
    return tile?.items?.map(item => ({ ...item, category: selectedCategory })) || [];
  };

  // Get latest items for sidebar
  const getLatestItems = (): (TileItem & { category: Category })[] => {
    return getAllItems()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 8);
  };

  const heroStory = selectedCategory === 'all' ? getHeroStory() : null;
  const currentItems = getCurrentItems();
  const latestItems = getLatestItems();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#50e2c3]/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#50e2c3]" />
          </div>
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header + Navigation Combined */}
      <header className="border-b border-white/[0.08] bg-[#0a0a0a]">
        <div className="max-w-[1600px] mx-auto px-4">
          {/* Top Row - Logo and Actions */}
          <div className="flex items-center justify-between py-3">
            {/* Left - HypurrFi Logo */}
            <div className="flex items-center gap-3 w-48">
              <Image
                src="/hypurrfi-logo.png"
                alt="HypurrFi"
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            </div>
            
            {/* Center - Title + Nav aligned */}
            <div className="flex-1 flex flex-col items-center">
              <h1 className="text-2xl font-bold text-white">
                HypurrRelevant
              </h1>
              <p className="text-zinc-500 text-xs mb-2">Crypto & AI News That Matters</p>
              
              {/* Navigation Tabs - directly under title */}
              <div className="flex items-center">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                    selectedCategory === 'all'
                      ? 'text-[#50e2c3] border-[#50e2c3]'
                      : 'text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  Top Stories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedCategory === cat.id
                        ? 'text-[#50e2c3] border-[#50e2c3]'
                        : 'text-zinc-400 border-transparent hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Right - Refresh + Launch App */}
            <div className="flex items-center gap-4 w-48 justify-end">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {lastUpdated && (
                  <span className="hidden sm:inline">
                    {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                )}
              </button>
              <a
                href="https://app.hypurr.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-sm px-4 py-2 rounded-full border-2 border-[#50e2c3] text-[#50e2c3] font-medium hover:bg-[#50e2c3] hover:text-black transition-all whitespace-nowrap"
              >
                Launch App
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Price Ticker */}
      <div className="bg-[#0a0a0a] border-b border-white/[0.06] overflow-hidden">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            {[...tickerPrices, ...tickerPrices].map((asset, index) => {
              const symbolColor = getTickerSymbolColor(asset.symbol);
              return (
                <div key={`${asset.symbol}-${index}`} className="ticker-item">
                  <span className="font-medium" style={{ color: symbolColor }}>{asset.symbol}</span>
                  <span className="text-white font-mono ml-2">
                    ${asset.price > 1000 ? asset.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className={`ml-2 text-xs font-medium flex items-center gap-0.5 ${asset.change24h >= 0 ? 'text-[#50e2c3]' : 'text-red-500'}`}>
                    {asset.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Left Sidebar - Featured Protocols */}
          <aside className="w-56 flex-shrink-0 hidden xl:block">
            <div className="sticky top-4">
              <div className="border-b-2 border-[#50e2c3] pb-2 mb-4">
                <h3 className="text-sm font-bold text-white">Featured</h3>
              </div>
              <div className="space-y-2">
                {HYPEREVM_PROTOCOLS.map((protocol) => (
                  <a
                    key={protocol.name}
                    href={protocol.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 px-3 -mx-1 rounded text-sm hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-zinc-300 group-hover:text-[#50e2c3] transition-colors">{protocol.name}</span>
                      <span className="text-xs text-zinc-500 text-right whitespace-nowrap">{protocol.description}</span>
                    </div>
                  </a>
                ))}
              </div>

              {/* Watchlist */}
              <Watchlist />
            </div>
          </aside>

          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            {/* Hero Story */}
            {heroStory && selectedCategory === 'all' && (
              <HeroStoryCard 
                item={heroStory} 
                onClick={() => setSelectedItem(heroStory)} 
              />
            )}

            {/* Category Header for non-all views */}
            {selectedCategory !== 'all' && (
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  All stories from this category
                </p>
              </div>
            )}

            {/* Story Grid */}
            {isCategoryLoading && selectedCategory !== 'all' ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#50e2c3]" />
              </div>
            ) : currentItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500">No stories yet. Click refresh to fetch latest news.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentItems.map((item) => (
                  <StoryCard
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar - Latest */}
          <aside className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-4">
              <div className="border-b-2 border-[#50e2c3] pb-2 mb-4">
                <h3 className="text-lg font-bold text-white">Latest</h3>
              </div>
              <div className="space-y-0">
                {latestItems.map((item) => (
                  <LatestItem 
                    key={item.id} 
                    item={item} 
                    onClick={() => setSelectedItem(item)} 
                  />
                ))}
              </div>
              
              {/* Quick Links */}
              <div className="mt-6 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
                <div className="space-y-2">
                  <a
                    href="https://dexscreener.com/hyperliquid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#50e2c3] transition-colors"
                  >
                    <span>DEX Screener</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://defillama.com/chain/Hyperliquid"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#50e2c3] transition-colors"
                  >
                    <span>DefiLlama</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://stats.hyperliquid.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#50e2c3] transition-colors"
                  >
                    <span>HL Stats</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-12 py-8">
        <div className="max-w-[1600px] mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="font-medium text-zinc-400">HypurrRelevant</span>
              <span>Part of the HypurrFi ecosystem</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/hypurrfi" target="_blank" rel="noopener noreferrer" className="hover:text-[#50e2c3] transition-colors">
                Twitter
              </a>
              <a href="https://discord.gg/hypurrfi" target="_blank" rel="noopener noreferrer" className="hover:text-[#50e2c3] transition-colors">
                Discord
              </a>
              <a href="https://hypurr.fi" target="_blank" rel="noopener noreferrer" className="hover:text-[#50e2c3] transition-colors">
                HypurrFi
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Article Summary Popup */}
      {selectedItem && (
        <ArticleSummary
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Chat Widget */}
      <ChatWidget />

      {/* Ticker Animation Styles */}
      <style jsx>{`
        .ticker-wrapper {
          width: 100%;
          overflow: hidden;
        }
        .ticker-content {
          display: flex;
          animation: ticker 40s linear infinite;
          width: fit-content;
        }
        .ticker-content:hover {
          animation-play-state: paused;
        }
        .ticker-item {
          display: flex;
          align-items: center;
          padding: 8px 24px;
          white-space: nowrap;
          font-size: 13px;
        }
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function RelevancyMeter({ score, reason, item }: { score?: number; reason?: string; item?: TileItem }) {
  // Calculate a fallback score if none provided
  let displayScore = score;
  let displayReason = reason;
  
  if (displayScore === undefined || displayScore === null) {
    // Fallback: calculate based on keywords
    if (item) {
      const text = `${item.calmHeadline} ${item.calmSummary || ''} ${item.originalTitle || ''}`.toLowerCase();
      const keywords = ['hyperliquid', 'hype', 'bitcoin', 'btc', 'ethereum', 'eth', 'defi', 'ai', 'hack', 'exploit'];
      let fallbackScore = 30; // Base score
      for (const kw of keywords) {
        if (text.includes(kw)) fallbackScore += 10;
      }
      displayScore = Math.min(fallbackScore, 100);
      displayReason = 'Estimated relevancy';
    } else {
      displayScore = 50; // Default middle score
      displayReason = 'Pending analysis';
    }
  }
  
  const getColor = (s: number) => {
    if (s >= 80) return '#50e2c3'; // Teal - highly relevant
    if (s >= 60) return '#84cc16'; // Lime - relevant
    if (s >= 40) return '#eab308'; // Yellow - moderate
    if (s >= 20) return '#f97316'; // Orange - low
    return '#ef4444'; // Red - not relevant
  };

  return (
    <div className="flex items-center gap-1.5 group/meter relative" title={displayReason || `Relevancy: ${displayScore}/100`}>
      {/* Mini bar */}
      <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all"
          style={{ 
            width: `${displayScore}%`,
            backgroundColor: getColor(displayScore)
          }}
        />
      </div>
      <span className="text-[10px] font-medium" style={{ color: getColor(displayScore) }}>
        {displayScore}
      </span>
      
      {/* Tooltip */}
      {displayReason && (
        <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-zinc-900 border border-white/10 rounded text-[10px] text-zinc-400 whitespace-nowrap opacity-0 group-hover/meter:opacity-100 transition-opacity pointer-events-none z-10">
          {displayReason}
        </div>
      )}
    </div>
  );
}

function StoryCard({ 
  item, 
  onClick 
}: { 
  item: TileItem & { category: Category };
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  
  const getCategoryGradient = (cat: Category) => {
    switch (cat) {
      case 'defi_alpha': return 'from-emerald-900/80 via-teal-900/60 to-zinc-900';
      case 'token_launches': return 'from-amber-900/80 via-orange-900/60 to-zinc-900';
      case 'security_alerts': return 'from-red-900/80 via-rose-900/60 to-zinc-900';
      case 'ai_frontier': return 'from-violet-900/80 via-purple-900/60 to-zinc-900';
      default: return 'from-zinc-800 to-zinc-900';
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case 'defi_alpha': return 'DeFi';
      case 'token_launches': return 'NEW';
      case 'security_alerts': return 'ALERT';
      case 'ai_frontier': return 'AI';
      default: return 'NEWS';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image */}
      <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[16/9] mb-3">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(item.category)} flex items-center justify-center relative`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-[#50e2c3]/30 blur-2xl" />
            </div>
            <div className="text-center z-10">
              <span className="text-3xl font-black text-white/20 tracking-wider">
                {getCategoryIcon(item.category)}
              </span>
              <p className="text-xs text-white/30 mt-1">{item.sourceName}</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#50e2c3]">
            {getCategoryLabel(item.category)}
          </span>
          <RelevancyMeter score={item.relevancyScore} reason={item.relevancyReason} item={item} />
        </div>
        <h3 className="text-lg font-semibold text-white leading-snug mt-1 group-hover:text-[#50e2c3] transition-colors line-clamp-2">
          {item.calmHeadline}
        </h3>
        <p className="text-sm text-zinc-400 mt-2 line-clamp-2">
          {item.calmSummary}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span>{item.sourceName}</span>
          <span>{getTimeAgo(item.publishedAt)}</span>
        </div>
      </div>
    </div>
  );
}

function HeroStoryCard({ 
  item, 
  onClick 
}: { 
  item: TileItem & { category: Category };
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  
  const getCategoryGradient = (cat: Category) => {
    switch (cat) {
      case 'defi_alpha': return 'from-emerald-900/80 via-teal-900/60 to-zinc-900';
      case 'token_launches': return 'from-amber-900/80 via-orange-900/60 to-zinc-900';
      case 'security_alerts': return 'from-red-900/80 via-rose-900/60 to-zinc-900';
      case 'ai_frontier': return 'from-violet-900/80 via-purple-900/60 to-zinc-900';
      default: return 'from-zinc-800 to-zinc-900';
    }
  };

  const getColor = (s: number) => {
    if (s >= 80) return '#50e2c3';
    if (s >= 60) return '#84cc16';
    if (s >= 40) return '#eab308';
    if (s >= 20) return '#f97316';
    return '#ef4444';
  };

  // Calculate fallback score
  let displayScore = item.relevancyScore;
  if (displayScore === undefined || displayScore === null) {
    const text = `${item.calmHeadline} ${item.calmSummary || ''}`.toLowerCase();
    const keywords = ['hyperliquid', 'hype', 'bitcoin', 'btc', 'ethereum', 'eth', 'defi', 'ai'];
    let fallbackScore = 30;
    for (const kw of keywords) {
      if (text.includes(kw)) fallbackScore += 10;
    }
    displayScore = Math.min(fallbackScore, 100);
  }

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer mb-8"
    >
      <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[2/1]">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${getCategoryGradient(item.category)} relative`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-[#50e2c3]/30 blur-3xl" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-white/10 tracking-wider">
                {item.category === 'defi_alpha' && 'DeFi ALPHA'}
                {item.category === 'token_launches' && 'NEW TOKEN'}
                {item.category === 'security_alerts' && 'SECURITY'}
                {item.category === 'ai_frontier' && 'AI FRONTIER'}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-[#50e2c3] text-black">
              {getCategoryLabel(item.category)}
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/50">
              <div className="w-16 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${displayScore}%`,
                    backgroundColor: getColor(displayScore)
                  }}
                />
              </div>
              <span className="text-xs text-white/80">{displayScore}</span>
            </div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-[#50e2c3] transition-colors">
            {item.calmHeadline}
          </h2>
          <p className="text-zinc-300 mt-2 line-clamp-2 max-w-2xl">
            {item.calmSummary}
          </p>
          <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
            <span>{item.sourceName}</span>
            <span>{getTimeAgo(item.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LatestItem({ 
  item, 
  onClick 
}: { 
  item: TileItem & { category: Category };
  onClick: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  
  const getCategoryColor = (cat: Category) => {
    switch (cat) {
      case 'defi_alpha': return 'bg-emerald-900/50';
      case 'token_launches': return 'bg-amber-900/50';
      case 'security_alerts': return 'bg-red-900/50';
      case 'ai_frontier': return 'bg-violet-900/50';
      default: return 'bg-zinc-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer py-3 border-b border-white/[0.06] last:border-0"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail */}
        <div className={`w-16 h-12 rounded overflow-hidden flex-shrink-0 ${!item.imageUrl || imgError ? getCategoryColor(item.category) : ''}`}>
          {item.imageUrl && !imgError ? (
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[10px] font-bold text-white/40">
                {item.category === 'defi_alpha' && 'DeFi'}
                {item.category === 'token_launches' && 'NEW'}
                {item.category === 'security_alerts' && 'SEC'}
                {item.category === 'ai_frontier' && 'AI'}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-300 leading-snug group-hover:text-[#50e2c3] transition-colors line-clamp-2">
            {item.calmHeadline}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-zinc-500">
              {getTimeAgo(item.publishedAt)}
            </span>
            <RelevancyMeter score={item.relevancyScore} reason={item.relevancyReason} item={item} />
          </div>
        </div>
      </div>
    </div>
  );
}

function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'defi_alpha': return 'DeFi Alpha';
    case 'token_launches': return 'Token Launches';
    case 'security_alerts': return 'Security';
    case 'ai_frontier': return 'AI Frontier';
    default: return 'News';
  }
}

function getTickerSymbolColor(symbol: string): string {
  switch (symbol) {
    case 'HYPE': return '#50e2c3'; // HypurrFi teal
    case 'BTC': return '#f7931a'; // Bitcoin orange
    case 'ETH': return '#627eea'; // Ethereum purple
    case 'XMR': return '#ff6600'; // Monero orange
    case 'GOLD': return '#ffd700'; // Gold
    case 'SILVER': return '#c0c0c0'; // Silver
    case 'URANIUM': return '#7fff00'; // Chartreuse/green
    case 'COPPER': return '#b87333'; // Copper brown
    default: return '#a1a1aa'; // zinc-400
  }
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  }
  return `${Math.floor(diffHours / 24)}d`;
}
