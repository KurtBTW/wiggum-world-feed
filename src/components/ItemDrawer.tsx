'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { X, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import type { TileItem } from '@/types';

interface ItemDrawerProps {
  item: TileItem | null;
  onClose: () => void;
  onExplain: (itemId: string) => Promise<void>;
  isExplaining: boolean;
}

export function ItemDrawer({ item, onClose, onExplain, isExplaining }: ItemDrawerProps) {
  if (!item) return null;

  const nyTime = toZonedTime(new Date(item.publishedAt), 'America/New_York');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-gray-900 rounded-xl border border-gray-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-700">
          <div className="flex-1 pr-4">
            <h2 className="text-lg font-semibold text-white mb-1">
              {item.calmHeadline}
            </h2>
            <p className="text-sm text-gray-400">
              {item.sourceName} • {format(nyTime, 'MMMM d, yyyy h:mm a')} ET
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {/* Original headline */}
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Original Headline</p>
            <p className="text-sm text-gray-300">{item.originalTitle}</p>
          </div>

          {/* Calm summary */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Summary</p>
            <p className="text-gray-200">{item.calmSummary}</p>
          </div>

          {/* Excerpt if available */}
          {item.excerpt && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Excerpt</p>
              <p className="text-sm text-gray-300">{item.excerpt}</p>
            </div>
          )}

          {/* Source link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Read full article at {item.sourceName}
          </a>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <button
            onClick={() => onExplain(item.id)}
            disabled={isExplaining}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-medium transition-all"
          >
            {isExplaining ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Explain with GPT-5.2
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
