'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Loader2, Clock, TrendingUp, TrendingDown, Shield, ShieldAlert, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { ArticleSummary } from '@/components/ArticleSummary';
import { ChatWidget } from '@/components/ChatWidget';
import type { TileSnapshot, TileItem, Category } from '@/types';

const CATEGORIES: { id: Category; label: string; icon: string; color: string }[] = [
  { id: 'token_launches', label: 'Token Launches', icon: '🚀', color: '#f59e0b' },
  { id: 'defi_alpha', label: 'DeFi Alpha', icon: '💎', color: '#8b5cf6' },
  { id: 'security_alerts', label: 'Security', icon: '🚨', color: '#ef4444' },
  { id: 'ai_frontier', label: 'AI Frontier', icon: '🤖', color: '#06b6d4' },
];

const MARKET_DATA = [
  { symbol: 'BTC', name: 'Bitcoin', price: 104851, change: 2.54 },
  { symbol: 'ETH', name: 'Ethereum', price: 3284, change: 4.12 },
  { symbol: 'SOL', name: 'Solana', price: 187.42, change: 3.21 },
  { symbol: 'HYPE', name: 'Hyperliquid', price: 24.56, change: 8.75 },
];

export default function Home() {
  const [tiles, setTiles] = useState<Record<Category, TileSnapshot | null>>({} as Record<Category, TileSnapshot | null>);
  const [selectedCategory, setSelectedCategory] = useState<Category>('token_launches');
  const [selectedItem, setSelectedItem] = useState<TileItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchTiles();
    const interval = setInterval(fetchTiles, 5 * 60 * 1000); // Refresh every 5 minutes
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

  const currentTile = tiles[selectedCategory];
  const currentItems = currentTile?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-[#fbbf24]/20 to-[#22c55e]/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24]" />
          </div>
          <p className="text-zinc-500 text-sm">Loading HypurrRelevancy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Image
                src="/hypurrfi-logo.png"
                alt="HypurrFi"
                width={140}
                height={40}
                className="h-8 w-auto"
                priority
              />
              <span className="text-sm text-zinc-500 hidden sm:block">Relevancy Feed</span>
            </div>
            
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <span className="text-xs text-zinc-500 hidden sm:block">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {lastUpdated.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 overflow-x-auto py-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-white/[0.08] text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
                style={{
                  borderBottom: selectedCategory === cat.id ? `2px solid ${cat.color}` : 'none'
                }}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {tiles[cat.id]?.items?.length ? (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-white/[0.1]">
                    {tiles[cat.id]?.items?.length}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            {currentItems.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.05] flex items-center justify-center">
                  <Zap className="w-8 h-8 text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm">No items yet. Click refresh to fetch latest data.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {currentItems.map((item, index) => (
                  <FeedItem
                    key={item.id}
                    item={item}
                    category={selectedCategory}
                    isFirst={index === 0}
                    onClick={() => setSelectedItem(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-[300px] flex-shrink-0 space-y-4 hidden lg:block">
            {/* Market Data */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#22c55e]" />
                Markets
              </h3>
              <div className="space-y-3">
                {MARKET_DATA.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium text-sm">{asset.symbol}</span>
                      <span className="text-zinc-500 text-xs ml-2">{asset.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-sm font-mono">
                        ${asset.price.toLocaleString()}
                      </div>
                      <div className={`text-xs font-medium ${asset.change >= 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Info */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h3 className="font-semibold text-white mb-2">
                {CATEGORIES.find(c => c.id === selectedCategory)?.icon}{' '}
                {CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </h3>
              <p className="text-zinc-400 text-sm">
                {selectedCategory === 'defi_alpha' && 'TVL movers, yield opportunities, and protocol updates from across DeFi.'}
                {selectedCategory === 'token_launches' && 'New token launches with security scores. Unsafe tokens are automatically hidden.'}
                {selectedCategory === 'security_alerts' && 'Exploits, hacks, rug pulls, and security incidents from Rekt News and more.'}
                {selectedCategory === 'ai_frontier' && 'Frontier model releases, AI agent developments, and research breakthroughs.'}
              </p>
            </div>

            {/* Chains */}
            {selectedCategory === 'token_launches' && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                <h3 className="font-semibold text-white mb-3">Tracking Chains</h3>
                <div className="flex flex-wrap gap-2">
                  {['Solana', 'Ethereum', 'Base', 'Arbitrum', 'Hyperliquid', 'BSC', 'Sui', 'Avalanche'].map((chain) => (
                    <span
                      key={chain}
                      className="px-2 py-1 text-xs rounded-full bg-white/[0.05] text-zinc-400"
                    >
                      {chain}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
}

function FeedItem({ 
  item, 
  category, 
  isFirst, 
  onClick 
}: { 
  item: TileItem; 
  category: Category; 
  isFirst: boolean;
  onClick: () => void;
}) {
  const isToken = category === 'token_launches';
  const isDefi = category === 'defi_alpha';

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all ${
        isFirst ? 'p-5' : 'p-4'
      }`}
    >
      <div className="flex gap-4">
        {/* Image or Icon */}
        <div className={`flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] flex items-center justify-center ${
          isFirst ? 'w-32 h-24' : 'w-20 h-16'
        }`}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span className={isFirst ? 'text-3xl' : 'text-2xl'}>
              {getCategoryEmoji(category)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-white font-medium leading-snug group-hover:text-[#fbbf24] transition-colors ${
              isFirst ? 'text-lg' : 'text-sm'
            }`}>
              {item.calmHeadline}
            </h3>
            
            {/* Security Badge for tokens */}
            {isToken && item.securityScore !== undefined && (
              <SecurityBadge score={item.securityScore} riskLevel={item.riskLevel} />
            )}
          </div>

          <p className={`text-zinc-400 mt-1 line-clamp-2 ${isFirst ? 'text-sm' : 'text-xs'}`}>
            {item.calmSummary}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
            <span>{item.sourceName}</span>
            <span>{getTimeAgo(item.publishedAt)}</span>
            
            {/* Token-specific info */}
            {isToken && item.priceUsd !== undefined && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="font-mono">${item.priceUsd < 0.01 ? item.priceUsd.toExponential(2) : item.priceUsd.toFixed(4)}</span>
                {item.priceChange24h !== undefined && (
                  <span className={item.priceChange24h >= 0 ? 'text-[#22c55e]' : 'text-red-500'}>
                    {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(1)}%
                  </span>
                )}
              </>
            )}

            {/* DeFi-specific info */}
            {isDefi && item.tvl !== undefined && (
              <>
                <span className="text-zinc-600">|</span>
                <span>TVL: {formatTVL(item.tvl)}</span>
                {item.tvlChange24h !== undefined && (
                  <span className={item.tvlChange24h >= 0 ? 'text-[#22c55e]' : 'text-red-500'}>
                    {item.tvlChange24h >= 0 ? '+' : ''}{item.tvlChange24h.toFixed(1)}%
                  </span>
                )}
              </>
            )}

            {/* Chain badge for tokens */}
            {isToken && item.chainId && (
              <span className="px-1.5 py-0.5 rounded bg-white/[0.05] text-zinc-400">
                {item.chainId}
              </span>
            )}
          </div>
        </div>

        {/* External link */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-2 text-zinc-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function SecurityBadge({ score, riskLevel }: { score: number; riskLevel?: string }) {
  const getColor = () => {
    if (score >= 80) return 'text-[#22c55e] bg-[#22c55e]/10';
    if (score >= 60) return 'text-[#84cc16] bg-[#84cc16]/10';
    if (score >= 40) return 'text-[#eab308] bg-[#eab308]/10';
    if (score >= 20) return 'text-[#f97316] bg-[#f97316]/10';
    return 'text-[#ef4444] bg-[#ef4444]/10';
  };

  const getIcon = () => {
    if (score >= 60) return <ShieldCheck className="w-3 h-3" />;
    if (score >= 40) return <Shield className="w-3 h-3" />;
    return <ShieldAlert className="w-3 h-3" />;
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {getIcon()}
      <span>{score}</span>
    </div>
  );
}

function getCategoryEmoji(category: Category): string {
  switch (category) {
    case 'defi_alpha': return '💎';
    case 'token_launches': return '🚀';
    case 'security_alerts': return '🚨';
    case 'ai_frontier': return '🤖';
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
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return `${Math.floor(diffHours / 24)}d ago`;
}

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) {
    return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  }
  if (tvl >= 1_000_000) {
    return `$${(tvl / 1_000_000).toFixed(2)}M`;
  }
  if (tvl >= 1_000) {
    return `$${(tvl / 1_000).toFixed(1)}K`;
  }
  return `$${tvl.toFixed(0)}`;
}
