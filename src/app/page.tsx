'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, Loader2, Globe } from 'lucide-react';
import { TileCard } from '@/components/TileCard';
import { ItemDrawer } from '@/components/ItemDrawer';
import { ChatTerminal } from '@/components/ChatTerminal';
import { LatestFeed } from '@/components/LatestFeed';
import type { TileSnapshot, TileItem, Category } from '@/types';

const CATEGORIES: Category[] = ['technology', 'crypto', 'ai', 'business', 'market_movements'];

export default function Home() {
  const [tiles, setTiles] = useState<Record<Category, TileSnapshot | null>>({} as Record<Category, TileSnapshot | null>);
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [boundItem, setBoundItem] = useState<TileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [sessionId] = useState(() => 
    typeof window !== 'undefined' 
      ? localStorage.getItem('chatSessionId') || uuidv4()
      : uuidv4()
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSessionId', sessionId);
    }
  }, [sessionId]);

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

  const handleItemClick = (item: TileItem) => {
    setSelectedItem(item);
    setBoundItem(item);
  };

  const handleExplain = async (itemId: string) => {
    setIsExplaining(true);
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: '',
          boundItemId: itemId,
          action: 'explain'
        })
      });
      setSelectedItem(null);
    } catch (error) {
      console.error('Failed to explain item:', error);
    } finally {
      setIsExplaining(false);
    }
  };

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
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#22c55e] flex items-center justify-center">
                <Globe className="w-5 h-5 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">
                  Wiggum World Feed
                </h1>
                <p className="text-[11px] text-zinc-500">
                  Calm, optimistic news
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-[11px] text-zinc-600 hidden sm:block">
                  {lastUpdated.toLocaleTimeString('en-US', { 
                    timeZone: 'America/New_York',
                    hour: 'numeric',
                    minute: '2-digit'
                  })} ET
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#fbbf24]' : 'text-zinc-400'}`} />
                <span className="text-zinc-300">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Side - Category Tiles */}
          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                World Changes at a Glance
              </h2>
              <p className="text-sm text-zinc-500 max-w-md mx-auto">
                Curated news filtered for optimism and forward progress. No doom, no hype.
              </p>
            </div>

            {/* Tile Grid - 5 columns on XL, 3 on LG, 2 on MD, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {CATEGORIES.map((category) => (
                <TileCard
                  key={category}
                  category={category}
                  snapshot={tiles[category]}
                  onItemClick={handleItemClick}
                />
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#fbbf24]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-lg">?</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-1">How it works</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Every hour, we fetch news from trusted sources, score them for optimism and forward-progress, 
                    run a 20-pass refinement loop to filter sensationalism, and present only the most constructive updates.
                    Click any item to read more or ask AI for deeper insights.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Latest Feed (Sticky Sidebar) */}
          <div className="hidden xl:block w-[380px] flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-120px)]">
              <LatestFeed 
                tiles={tiles} 
                onItemClick={handleItemClick}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Item Drawer */}
      {selectedItem && (
        <ItemDrawer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onExplain={handleExplain}
          isExplaining={isExplaining}
        />
      )}

      {/* Floating Chat Terminal */}
      <ChatTerminal
        sessionId={sessionId}
        boundItem={boundItem}
        onClearBoundItem={() => setBoundItem(null)}
      />
    </div>
  );
}
