'use client';

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ExternalLink, Clock, Zap, Cpu, Coins, Bot, Briefcase, BarChart3 } from 'lucide-react';
import type { TileSnapshot, TileItem, Category } from '@/types';

interface LatestFeedProps {
  tiles: Record<Category, TileSnapshot | null>;
  onItemClick: (item: TileItem) => void;
}

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  technology: <Cpu className="w-3 h-3" />,
  crypto: <Coins className="w-3 h-3" />,
  ai: <Bot className="w-3 h-3" />,
  business: <Briefcase className="w-3 h-3" />,
  market_movements: <BarChart3 className="w-3 h-3" />
};

const CATEGORY_LABELS: Record<Category, string> = {
  technology: 'Tech',
  crypto: 'Crypto',
  ai: 'AI',
  business: 'Business',
  market_movements: 'Markets'
};

const CATEGORY_COLORS: Record<Category, string> = {
  technology: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  crypto: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ai: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  business: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  market_movements: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

interface CombinedItem extends TileItem {
  category: Category;
}

export function LatestFeed({ tiles, onItemClick }: LatestFeedProps) {
  // Combine all items from all categories and sort by publishedAt
  const allItems: CombinedItem[] = Object.entries(tiles)
    .flatMap(([category, snapshot]) => 
      snapshot?.items.map(item => ({
        ...item,
        category: category as Category
      })) || []
    )
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="panel flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#fbbf24]" />
          <h2 className="font-semibold text-sm text-white">Latest</h2>
        </div>
        <span className="text-[10px] text-zinc-500 font-medium">
          {allItems.length} items
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {allItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white/[0.03] flex items-center justify-center">
                <Zap className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500">No updates yet</p>
              <p className="text-[10px] text-zinc-600 mt-1">Click refresh to fetch</p>
            </div>
          </div>
        ) : (
          allItems.map((item) => (
            <LatestItemCard 
              key={item.id} 
              item={item} 
              onClick={() => onItemClick(item)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LatestItemCard({ 
  item, 
  onClick 
}: { 
  item: CombinedItem; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg transition-all duration-200 group
        bg-white/[0.02] hover:bg-white/[0.04] 
        border border-transparent hover:border-white/[0.08]"
    >
      {/* Category Badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium border ${CATEGORY_COLORS[item.category]}`}>
          {CATEGORY_ICONS[item.category]}
          {CATEGORY_LABELS[item.category]}
        </span>
        <span className="text-[10px] text-zinc-600">{formatTime(item.publishedAt)}</span>
      </div>

      {/* Headline */}
      <h3 className="text-[13px] font-medium text-zinc-100 mb-1.5 line-clamp-2 leading-snug group-hover:text-white transition-colors">
        {item.calmHeadline}
      </h3>

      {/* Summary */}
      <p className="text-[11px] text-zinc-500 mb-2 line-clamp-2 leading-relaxed">
        {item.calmSummary}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="neon-source-badge">{item.sourceName}</span>
        <ExternalLink className="w-3 h-3 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const nyTime = toZonedTime(d, 'America/New_York');
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 1) {
    const mins = Math.floor(diffMs / (1000 * 60));
    return `${mins}m ago`;
  } else if (diffHours < 24) {
    return `${Math.floor(diffHours)}h ago`;
  }
  
  return format(nyTime, 'MMM d');
}
