'use client';

import { ExternalLink, Clock } from 'lucide-react';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  summary?: string;
  imageUrl?: string;
}

interface NewsCardProps {
  news: NewsItem;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function NewsCard({ news }: NewsCardProps) {
  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-lg transition-all group"
    >
      <div className="flex items-start gap-3">
        {news.imageUrl && (
          <img
            src={news.imageUrl}
            alt=""
            className="w-16 h-16 rounded object-cover flex-shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-zinc-500">{news.source}</span>
            <span className="text-xs text-zinc-600">•</span>
            <div className="flex items-center gap-1 text-xs text-zinc-600">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(news.publishedAt)}
            </div>
          </div>
          <h3 className="text-sm font-medium text-white group-hover:text-[#50e2c3] transition-colors line-clamp-2 mb-1">
            {news.title}
          </h3>
          {news.summary && (
            <p className="text-xs text-zinc-500 line-clamp-2">{news.summary}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-[#50e2c3] transition-colors flex-shrink-0" />
      </div>
    </a>
  );
}
