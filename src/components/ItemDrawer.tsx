'use client';

import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { X, Sparkles, ArrowUpRight } from 'lucide-react';
import type { TileItem } from '@/types';

interface ItemDrawerProps {
  item: TileItem | null;
  onClose: () => void;
  onExplain?: () => void;
}

export function ItemDrawer({ item, onClose, onExplain }: ItemDrawerProps) {
  if (!item) return null;

  const nyTime = toZonedTime(new Date(item.publishedAt), 'America/New_York');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0F0F12] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/[0.06]">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-white leading-tight mb-2">
              {item.calmHeadline}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="neon-source-badge">{item.sourceName}</span>
              <span>·</span>
              <span>{format(nyTime, 'MMM d, yyyy · h:mm a')} ET</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -m-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[50vh] space-y-4">
          {/* Original headline */}
          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
              Original Headline
            </p>
            <p className="text-sm text-zinc-300">{item.originalTitle}</p>
          </div>

          {/* Calm summary */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
              Summary
            </p>
            <p className="text-sm text-zinc-200 leading-relaxed">{item.calmSummary}</p>
          </div>

          {/* Excerpt if available */}
          {item.excerpt && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5 font-medium">
                Excerpt
              </p>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.excerpt}</p>
            </div>
          )}

          {/* Source link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#fbbf24] hover:text-[#22c55e] transition-colors group"
          >
            <span>Read full article</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

        {onExplain && (
          <div className="p-5 border-t border-white/[0.06] bg-white/[0.01]">
            <button
              onClick={onExplain}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all gradient-border bg-gradient-to-r from-[#fbbf24]/10 to-[#22c55e]/10 hover:from-[#fbbf24]/20 hover:to-[#22c55e]/20 text-white"
            >
              <Sparkles className="w-4 h-4 text-[#fbbf24]" />
              <span>Summarize with AI</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
