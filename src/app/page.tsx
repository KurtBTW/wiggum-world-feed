'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, ExternalLink, ChevronRight } from 'lucide-react';
import { ArticleSummary } from '@/components/ArticleSummary';
import { ChatWidget } from '@/components/ChatWidget';
import type { TileSnapshot, TileItem, Category } from '@/types';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'defi_alpha', label: 'DeFi Alpha' },
  { id: 'token_launches', label: 'Token Launches' },
  { id: 'security_alerts', label: 'Security' },
  { id: 'ai_frontier', label: 'AI Frontier' },
];

// Keywords that indicate major news for HypurrFi users
const MAJOR_NEWS_KEYWORDS = [
  'hyperliquid', 'hype', 'bitcoin', 'btc', 'ethereum', 'eth', 'solana', 'sol',
  'billion', 'million', 'crash', 'surge', 'hack', 'exploit', 'breaking',
  'gpt-5', 'gpt-6', 'claude', 'gemini', 'openai', 'anthropic', 'regulation',
  'sec', 'etf', 'approval', 'blackrock', 'record', 'all-time'
];

export default function Home() {
  const [tiles, setTiles] = useState<Record<Category, TileSnapshot | null>>({} as Record<Category, TileSnapshot | null>);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchTiles();
    const interval = setInterval(fetchTiles, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/tiles', { method: 'POST' });
      const data = await res.json();
      if (data.tiles) {
        setTiles(data.tiles);
        setLastUpdated(new Date(data.lastUpdated));
      }
    } catch (error) {
      console.error('Failed to refresh tiles:', error);
    } finally {
      setIsRefreshing(false);
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
    const tile = tiles[selectedCategory];
    return tile?.items?.map(item => ({ ...item, category: selectedCategory })) || [];
  };

  // Get latest items for sidebar
  const getLatestItems = (): (TileItem & { category: Category })[] => {
    return getAllItems()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);
  };

  const heroStory = selectedCategory === 'all' ? getHeroStory() : null;
  const currentItems = getCurrentItems();
  const latestItems = getLatestItems();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#fbbf24]/20 to-[#22c55e]/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" />
          </div>
          <p className="text-zinc-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left spacer */}
            <div className="w-32" />
            
            {/* Center - Logo */}
            <div className="text-center">
              <h1 className="text-3xl font-bold">
                <span className="bg-gradient-to-r from-[#fbbf24] to-[#22c55e] bg-clip-text text-transparent">
                  HypurrRelevant
                </span>
              </h1>
              <p className="text-zinc-500 text-xs mt-0.5">Crypto & AI News That Matters</p>
            </div>
            
            {/* Right - HypurrFi links */}
            <div className="flex items-center gap-4 w-32 justify-end">
              <a
                href="https://hypurr.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-[#fbbf24] transition-colors"
              >
                HypurrFi
              </a>
              <a
                href="https://app.hypurr.fi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black font-medium hover:opacity-90 transition-opacity"
              >
                Launch App
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-white/[0.08] bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedCategory === 'all'
                    ? 'text-[#fbbf24] border-[#fbbf24]'
                    : 'text-zinc-400 border-transparent hover:text-white'
                }`}
              >
                Top Stories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-[#fbbf24] border-[#fbbf24]'
                      : 'text-zinc-400 border-transparent hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {lastUpdated && (
                <span>
                  {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            {/* Hero Story */}
            {heroStory && selectedCategory === 'all' && (
              <div
                onClick={() => setSelectedItem(heroStory)}
                className="group cursor-pointer mb-8"
              >
                <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[2/1]">
                  {heroStory.imageUrl ? (
                    <img
                      src={heroStory.imageUrl}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#fbbf24]/20 to-[#22c55e]/20" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-[#fbbf24] text-black mb-3">
                      {getCategoryLabel(heroStory.category)}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-[#fbbf24] transition-colors">
                      {heroStory.calmHeadline}
                    </h2>
                    <p className="text-zinc-300 mt-2 line-clamp-2 max-w-2xl">
                      {heroStory.calmSummary}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-sm text-zinc-400">
                      <span>{heroStory.sourceName}</span>
                      <span>{getTimeAgo(heroStory.publishedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Story Grid */}
            {currentItems.length === 0 ? (
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

          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0 hidden lg:block">
            {/* Latest Section */}
            <div className="sticky top-4">
              <div className="border-b-2 border-[#fbbf24] pb-2 mb-4">
                <h3 className="text-lg font-bold text-white">Latest</h3>
              </div>
              <div className="space-y-0">
                {latestItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="group cursor-pointer py-3 border-b border-white/[0.06] last:border-0"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-zinc-500 pt-0.5 w-8 flex-shrink-0">
                        {getTimeAgo(item.publishedAt)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-300 leading-snug group-hover:text-[#fbbf24] transition-colors line-clamp-2">
                          {item.calmHeadline}
                        </p>
                        <span className="text-xs text-zinc-500 mt-1 block">
                          {getCategoryLabel(item.category)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Quick Links */}
              <div className="mt-8 p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                <div className="space-y-2">
                  <a
                    href="https://app.hypurr.fi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#fbbf24] transition-colors"
                  >
                    <span>Trade on HypurrFi</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://hyperliquid.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#fbbf24] transition-colors"
                  >
                    <span>Hyperliquid</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://dexscreener.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#fbbf24] transition-colors"
                  >
                    <span>DEX Screener</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a
                    href="https://defillama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-zinc-400 hover:text-[#fbbf24] transition-colors"
                  >
                    <span>DefiLlama</span>
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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="font-medium text-zinc-400">HypurrRelevant</span>
              <span>Part of the HypurrFi ecosystem</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/hypurrfi" target="_blank" rel="noopener noreferrer" className="hover:text-[#fbbf24] transition-colors">
                Twitter
              </a>
              <a href="https://discord.gg/hypurrfi" target="_blank" rel="noopener noreferrer" className="hover:text-[#fbbf24] transition-colors">
                Discord
              </a>
              <a href="https://hypurr.fi" target="_blank" rel="noopener noreferrer" className="hover:text-[#fbbf24] transition-colors">
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
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer"
    >
      {/* Image */}
      <div className="relative rounded-lg overflow-hidden bg-zinc-900 aspect-[16/9] mb-3">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <span className="text-4xl opacity-20">
              {item.category === 'defi_alpha' && '📈'}
              {item.category === 'token_launches' && '🪙'}
              {item.category === 'security_alerts' && '🔒'}
              {item.category === 'ai_frontier' && '🤖'}
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div>
        <span className="text-xs font-medium text-[#fbbf24]">
          {getCategoryLabel(item.category)}
        </span>
        <h3 className="text-lg font-semibold text-white leading-snug mt-1 group-hover:text-[#fbbf24] transition-colors line-clamp-2">
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

function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'defi_alpha': return 'DeFi Alpha';
    case 'token_launches': return 'Token Launches';
    case 'security_alerts': return 'Security';
    case 'ai_frontier': return 'AI Frontier';
    default: return 'News';
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
