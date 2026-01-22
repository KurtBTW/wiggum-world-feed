'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Clock, Heart, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { ArticleSummary } from '@/components/ArticleSummary';
import type { TileSnapshot, TileItem, Category } from '@/types';

const CATEGORIES: Category[] = ['technology', 'crypto', 'ai', 'business', 'market_movements'];

const TOPIC_TAGS = [
  { icon: '🔬', label: 'Tech & Science', active: true },
  { icon: '💰', label: 'Finance', active: true },
  { icon: '🎨', label: 'Arts & Culture', active: false },
  { icon: '⚡', label: 'Crypto', active: true },
  { icon: '🤖', label: 'AI', active: true },
];

export default function Home() {
  const [tiles, setTiles] = useState<Record<Category, TileSnapshot | null>>({} as Record<Category, TileSnapshot | null>);
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchTiles();
    const interval = setInterval(fetchTiles, 60 * 60 * 1000);
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

  // Combine all items and sort by time
  const allItems: (TileItem & { category: Category })[] = Object.entries(tiles)
    .flatMap(([category, snapshot]) => 
      snapshot?.items.map(item => ({ ...item, category: category as Category })) || []
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const featuredItem = allItems[0];
  const gridItems = allItems.slice(1, 7);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#fbbf24]/20 to-[#22c55e]/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" />
          </div>
          <p className="text-zinc-500 text-sm">Loading feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/hypurrfi-logo.png"
                alt="HypurrFi"
                width={140}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-zinc-500">
                  Updated {lastUpdated.toLocaleTimeString('en-US', { 
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Discover Header */}
            <div className="flex items-center gap-6 mb-8">
              <h1 className="text-5xl font-light text-white">Discover</h1>
              <nav className="flex items-center gap-6">
                <button className="text-white font-medium pb-2 border-b-2 border-[#fbbf24]">
                  Top
                </button>
                <button className="text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                  Topics
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </nav>
            </div>

            {/* Featured Story */}
            {featuredItem && (
              <div 
                className="mb-10 cursor-pointer group"
                onClick={() => setSelectedItem(featuredItem)}
              >
                <div className="flex gap-8">
                  {/* Text Content */}
                  <div className="flex-1">
                    <h2 className="text-4xl font-serif text-white leading-tight mb-4 group-hover:text-[#fbbf24] transition-colors">
                      {featuredItem.calmHeadline}
                    </h2>
                    
                    <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                      <Clock className="w-4 h-4" />
                      <span>Published {getTimeAgo(featuredItem.publishedAt)}</span>
                    </div>
                    
                    <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                      {featuredItem.calmSummary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] flex items-center justify-center text-[10px] font-bold text-black">
                            {featuredItem.sourceName.charAt(0)}
                          </div>
                        </div>
                        <span className="text-zinc-500 text-sm">1 source</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                          <Heart className="w-5 h-5 text-zinc-500" />
                        </button>
                        <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                          <MoreHorizontal className="w-5 h-5 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Placeholder */}
                  <div className="w-[400px] h-[280px] rounded-2xl bg-gradient-to-br from-[#fbbf24]/20 to-[#22c55e]/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] flex items-center justify-center">
                        <span className="text-2xl font-bold text-black">
                          {getCategoryEmoji(featuredItem.category)}
                        </span>
                      </div>
                      <span className="text-zinc-500 text-sm uppercase tracking-wider">
                        {featuredItem.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-white/[0.06] mb-8" />

            {/* Story Grid */}
            <div className="grid grid-cols-3 gap-6">
              {gridItems.map((item) => (
                <div 
                  key={item.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedItem(item)}
                >
                  {/* Image Placeholder */}
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white/[0.03] to-white/[0.06] mb-4 flex items-center justify-center overflow-hidden group-hover:from-[#fbbf24]/10 group-hover:to-[#22c55e]/10 transition-all">
                    <div className="text-center">
                      <span className="text-3xl">
                        {getCategoryEmoji(item.category)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Card Content */}
                  <h3 className="text-white font-medium leading-snug mb-3 group-hover:text-[#fbbf24] transition-colors line-clamp-2">
                    {item.calmHeadline}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] flex items-center justify-center text-[8px] font-bold text-black">
                        {item.sourceName.charAt(0)}
                      </div>
                      <span className="text-zinc-500 text-xs">1 source</span>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                        <Heart className="w-4 h-4 text-zinc-500" />
                      </button>
                      <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-[320px] flex-shrink-0 space-y-6">
            {/* Make it yours */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-white">Make it yours</h3>
              </div>
              <p className="text-zinc-500 text-sm mb-4">
                Select topics and interests to customize your Discover experience
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {TOPIC_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                      tag.active 
                        ? 'bg-white/[0.08] text-white border border-white/[0.1]' 
                        : 'bg-transparent text-zinc-500 border border-white/[0.06] hover:border-white/[0.1]'
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
              
              <button className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black font-semibold text-sm hover:opacity-90 transition-opacity">
                Save Interests
              </button>
            </div>

            {/* Market Outlook */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h3 className="font-semibold text-white mb-4">Market Outlook</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <MarketCard 
                  name="S&P 500" 
                  value="$6,927.00" 
                  change="+1.43%" 
                  positive={true} 
                />
                <MarketCard 
                  name="NASDAQ" 
                  value="$25,566" 
                  change="+1.74%" 
                  positive={true} 
                />
                <MarketCard 
                  name="Bitcoin" 
                  value="$104,851" 
                  change="+2.54%" 
                  positive={true} 
                />
                <MarketCard 
                  name="Ethereum" 
                  value="$3,284" 
                  change="+4.12%" 
                  positive={true} 
                />
              </div>
            </div>

            {/* Trending Topics */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
              <h3 className="font-semibold text-white mb-4">Trending Topics</h3>
              
              <div className="space-y-3">
                {['AI Development', 'DeFi Updates', 'Tech Earnings', 'Crypto Markets'].map((topic, i) => (
                  <div key={topic} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-600 text-sm">{i + 1}</span>
                      <span className="text-zinc-300 text-sm">{topic}</span>
                    </div>
                    <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Article Summary Popup */}
      {selectedItem && (
        <ArticleSummary
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function MarketCard({ name, value, change, positive }: { 
  name: string; 
  value: string; 
  change: string; 
  positive: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-zinc-400 text-xs truncate">{name}</span>
        <span className={`text-xs font-medium flex items-center gap-0.5 ${positive ? 'text-[#22c55e]' : 'text-red-500'}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <span className="text-white font-semibold text-sm">{value}</span>
    </div>
  );
}

function getCategoryEmoji(category: Category): string {
  switch (category) {
    case 'technology': return '💻';
    case 'crypto': return '₿';
    case 'ai': return '🤖';
    case 'business': return '📊';
    case 'market_movements': return '📈';
    default: return '📰';
  }
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  return `${Math.floor(diffHours / 24)} days ago`;
}
