'use client';

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ExternalLink, Clock, Newspaper } from 'lucide-react';
import type { TileSnapshot, TileItem, Category } from '@/types';

interface TileCardProps {
  category: Category;
  snapshot: TileSnapshot | null;
  onItemClick: (item: TileItem) => void;
}

const CATEGORY_COLORS: Record<Category, string> = {
  technology: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  crypto: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  ai: 'from-green-500/20 to-green-600/10 border-green-500/30',
  business: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
  market_movements: 'from-red-500/20 to-red-600/10 border-red-500/30'
};

const CATEGORY_ICONS: Record<Category, string> = {
  technology: '💻',
  crypto: '🪙',
  ai: '🤖',
  business: '📊',
  market_movements: '📈'
};

const CATEGORY_TITLES: Record<Category, string> = {
  technology: 'Technology',
  crypto: 'Crypto',
  ai: 'AI',
  business: 'Business',
  market_movements: 'Market Movements'
};

export function TileCard({ category, snapshot, onItemClick }: TileCardProps) {
  const colorClass = CATEGORY_COLORS[category];
  const icon = CATEGORY_ICONS[category];
  const title = CATEGORY_TITLES[category];

  return (
    <div className={`rounded-xl border bg-gradient-to-br ${colorClass} p-4 h-full flex flex-col`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {snapshot && (
          <span className="ml-auto text-xs text-gray-400">
            {snapshot.items.length} items
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {!snapshot || snapshot.items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items yet</p>
            </div>
          </div>
        ) : (
          snapshot.items.map((item) => (
            <TileItemCard 
              key={item.id} 
              item={item} 
              onClick={() => onItemClick(item)} 
            />
          ))
        )}
      </div>

      {/* Footer with last update */}
      {snapshot && (
        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Updated {formatTime(snapshot.updatedAt)}
        </div>
      )}
    </div>
  );
}

function TileItemCard({ item, onClick }: { item: TileItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors group"
    >
      {/* Headline */}
      <h3 className="text-sm font-medium text-white mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
        {item.calmHeadline}
      </h3>

      {/* Summary */}
      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
        {item.calmSummary}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="truncate max-w-[120px]">{item.sourceName}</span>
        <span>•</span>
        <span>{formatTime(item.publishedAt)}</span>
        <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function formatTime(date: Date | string): string {
  const d = new Date(date);
  const nyTime = toZonedTime(d, 'America/New_York');
  return format(nyTime, 'MMM d, h:mm a');
}
