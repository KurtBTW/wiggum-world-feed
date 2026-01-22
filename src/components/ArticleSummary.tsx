'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { X, ExternalLink, Loader2, Sparkles, Newspaper } from 'lucide-react';
import type { TileItem } from '@/types';

interface ArticleSummaryProps {
  item: TileItem;
  onClose: () => void;
}

interface Summary {
  headline: string;
  byline: string;
  leadParagraph: string;
  body: string;
  keyPoints: string[];
  outlook: string;
}

export function ArticleSummary({ item, onClose }: ArticleSummaryProps) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const nyTime = toZonedTime(new Date(item.publishedAt), 'America/New_York');

  const handleSummarize = async () => {
    if (summary) {
      setShowSummary(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'summary',
          boundItemId: item.id,
          action: 'summarize'
        })
      });

      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        setShowSummary(true);
      } else {
        setError('Failed to generate summary');
      }
    } catch (err) {
      setError('Failed to connect to AI service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg border border-white/[0.1] bg-[#0f0f0f] shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header with Image */}
          <div className="relative">
            {item.imageUrl ? (
              <div className="aspect-video bg-zinc-900">
                <img
                  src={item.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
              </div>
            ) : (
              <div className="h-4 bg-gradient-to-r from-[#50e2c3]/20 to-transparent" />
            )}
          </div>

          {/* Article Info */}
          <div className="px-6 py-4">
            {/* Source and Time */}
            <div className="flex items-center gap-3 text-sm text-zinc-400 mb-4">
              <span className="px-2 py-1 rounded bg-[#50e2c3]/10 text-[#50e2c3] font-medium text-xs">
                {item.sourceName}
              </span>
              <span>{format(nyTime, 'MMMM d, yyyy · h:mm a')} ET</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl font-bold text-white leading-tight mb-4">
              {item.calmHeadline || item.originalTitle}
            </h1>

            {/* Original Summary/Excerpt */}
            <div className="text-zinc-300 leading-relaxed mb-6">
              <p>{item.calmSummary}</p>
              {item.excerpt && item.excerpt !== item.calmSummary && (
                <p className="mt-4 text-zinc-400">{item.excerpt}</p>
              )}
            </div>

            {/* AI Summary Section */}
            {!showSummary ? (
              <button
                onClick={handleSummarize}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-[#50e2c3]/20 to-[#50e2c3]/10 border border-[#50e2c3]/30 text-[#50e2c3] font-medium hover:from-[#50e2c3]/30 hover:to-[#50e2c3]/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Reading & Summarizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>AI Summarize</span>
                  </>
                )}
              </button>
            ) : summary ? (
              <div className="border border-[#50e2c3]/20 rounded-lg overflow-hidden">
                {/* AI Summary Header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#50e2c3]/10 border-b border-[#50e2c3]/20">
                  <Sparkles className="w-4 h-4 text-[#50e2c3]" />
                  <span className="text-sm font-medium text-[#50e2c3]">AI Summary</span>
                  <button
                    onClick={() => setShowSummary(false)}
                    className="ml-auto text-xs text-zinc-400 hover:text-white transition-colors"
                  >
                    Hide
                  </button>
                </div>

                {/* Summary Content */}
                <div className="p-4 space-y-4 bg-white/[0.02]">
                  {/* Rewritten Headline */}
                  <div>
                    <h2 className="text-lg font-semibold text-white">{summary.headline}</h2>
                    <p className="text-xs text-zinc-500 mt-1">{summary.byline}</p>
                  </div>

                  {/* Lead */}
                  <p className="text-zinc-300 leading-relaxed">{summary.leadParagraph}</p>

                  {/* Body */}
                  {summary.body && (
                    <p className="text-zinc-400 leading-relaxed text-sm">{summary.body}</p>
                  )}

                  {/* Key Points */}
                  {summary.keyPoints && summary.keyPoints.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-2">Key Points</h3>
                      <ul className="space-y-1">
                        {summary.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                            <span className="text-[#50e2c3] mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Outlook */}
                  {summary.outlook && (
                    <div className="pt-3 border-t border-white/[0.06]">
                      <h3 className="text-sm font-semibold text-white mb-2">Looking Ahead</h3>
                      <p className="text-sm text-zinc-400">{summary.outlook}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-6 py-4 flex items-center justify-between">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#50e2c3] hover:text-[#50e2c3]/80 transition-colors"
            >
              <Newspaper className="w-4 h-4" />
              <span>Read full article</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {summary && !showSummary && (
              <button
                onClick={() => setShowSummary(true)}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Show AI Summary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
