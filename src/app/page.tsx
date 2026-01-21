'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RefreshCw, Loader2 } from 'lucide-react';
import { TileCard } from '@/components/TileCard';
import { ItemDrawer } from '@/components/ItemDrawer';
import { ChatTerminal } from '@/components/ChatTerminal';
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

  // Store session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatSessionId', sessionId);
    }
  }, [sessionId]);

  // Fetch tiles on mount and set up hourly refresh
  useEffect(() => {
    fetchTiles();
    const interval = setInterval(fetchTiles, 60 * 60 * 1000); // Hourly
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
    setBoundItem(item); // Also bind to chat context
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
      setSelectedItem(null); // Close drawer after explain
    } catch (error) {
      console.error('Failed to explain item:', error);
    } finally {
      setIsExplaining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading Wiggum World Feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-64">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              🌍 Wiggum World Feed
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Calm, optimistic world changes • Refreshes hourly
            </p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
                  timeZone: 'America/New_York',
                  hour: 'numeric',
                  minute: '2-digit'
                })} ET
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Tile Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {CATEGORIES.map((category) => (
            <TileCard
              key={category}
              category={category}
              snapshot={tiles[category]}
              onItemClick={handleItemClick}
            />
          ))}
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

      {/* Chat Terminal */}
      <ChatTerminal
        sessionId={sessionId}
        boundItem={boundItem}
        onClearBoundItem={() => setBoundItem(null)}
      />
    </div>
  );
}
