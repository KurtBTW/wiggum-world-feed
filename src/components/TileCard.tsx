'use client';

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { ExternalLink, Clock, TrendingUp, Cpu, Coins, Bot, Briefcase, BarChart3 } from 'lucide-react';
import type { TileSnapshot, TileItem, Category } from '@/types';

interface TileCardProps {
  category: Category;
  snapshot: TileSnapshot | null;
  onItemClick: (item: TileItem) => void;
}

const CATEGORY_CONFIG: Record<Category, { icon: React.ReactNode; label: string }> = {
  technology: { icon: <Cpu className="w-4 h-4" />, label: 'Technology' },
  crypto: { icon: <Coins className="w-4 h-4" />, label: 'Crypto' },
  ai: { icon: <Bot className="w-4 h-4" />, label: 'AI' },
  business: { icon: <Briefcase className="w-4 h-4" />, label: 'Business' },
  market_movements: { icon: <BarChart3 className="w-4 h-4" />, label: 'Markets' }
};

export function TileCard({ category, snapshot, onItemClick }: TileCardProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="panel flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[#fbbf24]">{config.icon}</span>
          <h2 className="font-semibold text-sm text-white">{config.label}</h2>
        </div>
        {snapshot && (
          <span className="text-[10px] text-zinc-500 font-medium">
            {snapshot.items.length} items
          </span>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {!snapshot || snapshot.items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-white/[0.03] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-xs text-zinc-500">No updates yet</p>
              <p className="text-[10px] text-zinc-600 mt-1">Click refresh to fetch</p>
            </div>
          </div>
        ) : (
          snapshot.items.map((item, index) => (
            <TileItemCard 
              key={item.id} 
              item={item} 
              onClick={() => onItemClick(item)}
              isFirst={index === 0}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {snapshot && (
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] text-zinc-500">
            {formatTime(snapshot.updatedAt)}
          </span>
        </div>
      )}
    </div>
  );
}

function TileItemCard({ 
  item, 
  onClick,
  isFirst 
}: { 
  item: TileItem; 
  onClick: () => void;
  isFirst: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-3 rounded-lg transition-all duration-200 group
        bg-white/[0.02] hover:bg-white/[0.04] 
        border border-transparent hover:border-white/[0.08]
        ${isFirst ? 'border-l-2 border-l-[#22c55e]' : ''}
      `}
    >
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
        <div className="flex items-center gap-1.5 text-zinc-600">
          <span className="truncate max-w-[100px]">{item.sourceName}</span>
          <span className="text-zinc-700">·</span>
          <span>{formatTime(item.publishedAt)}</span>
        </div>
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
