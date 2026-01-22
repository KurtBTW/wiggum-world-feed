'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { X, ExternalLink, Loader2, Sparkles } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nyTime = toZonedTime(new Date(item.publishedAt), 'America/New_York');

  useEffect(() => {
    async function fetchSummary() {
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
        } else {
          setError('Failed to generate summary');
        }
      } catch (err) {
        setError('Failed to connect to AI service');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Newspaper Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg border border-white/[0.1] bg-[#faf9f6] shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
        >
          <X className="w-5 h-5 text-black/60" />
        </button>

        {/* Content */}
        <div className="overflow-y-auto max-h-[90vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] px-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-[10px] uppercase tracking-widest text-[#fbbf24] font-semibold">
                AI Summary by GPT-5.2
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="neon-source-badge">{item.sourceName}</span>
              <span>{format(nyTime, 'MMMM d, yyyy · h:mm a')} ET</span>
            </div>
          </div>

          {/* Newspaper Content */}
          <div className="p-6 newspaper-content">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#fbbf24] mb-4" />
                <p className="text-black/60 text-sm">Generating AI summary...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-600 mb-4">{error}</p>
                <p className="text-black/60 text-sm">Showing original content instead:</p>
                <h1 className="newspaper-headline mt-4">{item.calmHeadline}</h1>
                <p className="newspaper-lead mt-4">{item.calmSummary}</p>
              </div>
            ) : summary ? (
              <>
                {/* Headline */}
                <h1 className="newspaper-headline">
                  {summary.headline}
                </h1>

                {/* Byline */}
                <p className="newspaper-byline">
                  {summary.byline}
                </p>

                {/* Divider */}
                <div className="newspaper-divider" />

                {/* Lead Paragraph */}
                <p className="newspaper-lead">
                  {summary.leadParagraph}
                </p>

                {/* Body */}
                {summary.body && (
                  <p className="newspaper-body">
                    {summary.body}
                  </p>
                )}

                {/* Key Points */}
                {summary.keyPoints && summary.keyPoints.length > 0 && (
                  <div className="newspaper-keypoints">
                    <h3>Key Points</h3>
                    <ul>
                      {summary.keyPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Outlook */}
                {summary.outlook && (
                  <div className="newspaper-outlook">
                    <h3>Looking Ahead</h3>
                    <p>{summary.outlook}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="border-t border-black/10 px-6 py-4 bg-black/[0.02]">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#1a1a1a] hover:text-[#fbbf24] transition-colors"
            >
              <span>Read original article</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
