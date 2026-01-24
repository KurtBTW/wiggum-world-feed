'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Heart, Repeat2, MessageCircle, Eye, ExternalLink, ChevronDown, ChevronUp,
  Megaphone, BarChart3, MessageSquare, BookOpen, Building2, User, X
} from 'lucide-react';

export interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  category: string;
  categoryReason?: string;
  publishedAt: string;
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  viewCount?: number;
  urls?: string[];
  hashtags?: string[];
  mentions?: string[];
  account: {
    username: string;
    displayName: string;
    profileImageUrl?: string;
    accountType: string;
    personName?: string;
    personRole?: string;
    member?: {
      name: string;
      slug: string;
    };
  };
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  ANNOUNCEMENT: { 
    icon: <Megaphone className="w-3.5 h-3.5" />, 
    label: 'Announcement',
    color: 'text-green-400',
    bg: 'bg-green-500/20 border-green-500/30'
  },
  METRICS: { 
    icon: <BarChart3 className="w-3.5 h-3.5" />, 
    label: 'Metrics',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20 border-blue-500/30'
  },
  COMMENTARY: { 
    icon: <MessageSquare className="w-3.5 h-3.5" />, 
    label: 'Commentary',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20 border-purple-500/30'
  },
  THREAD: { 
    icon: <BookOpen className="w-3.5 h-3.5" />, 
    label: 'Thread',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20 border-amber-500/30'
  },
};

const ACCOUNT_TYPE_ICON: Record<string, React.ReactNode> = {
  PROTOCOL: <Building2 className="w-3 h-3" />,
  FOUNDER: <User className="w-3 h-3" />,
  TEAM: <User className="w-3 h-3" />,
};

export function TweetCard({ tweet, compact = false }: { tweet: Tweet; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[tweet.category];
  const tweetUrl = `https://twitter.com/${tweet.account.username}/status/${tweet.tweetId}`;
  const isLong = tweet.text.length > 180;

  return (
    <div
      className={`
        bg-white/[0.02] border border-white/[0.06] rounded-xl transition-all
        ${expanded ? 'border-white/[0.15] bg-white/[0.04]' : 'hover:border-white/[0.1] hover:bg-white/[0.03]'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div 
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden`}>
            {tweet.account.profileImageUrl ? (
              <img 
                src={tweet.account.profileImageUrl} 
                alt={tweet.account.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-white`}>
                {tweet.account.displayName[0]}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-semibold text-white ${compact ? 'text-xs' : 'text-sm'} truncate`}>
                {tweet.account.displayName}
              </span>
              <span className={`text-zinc-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                @{tweet.account.username}
              </span>
              <span className="text-zinc-600">·</span>
              <span className={`text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {formatDistanceToNow(new Date(tweet.publishedAt), { addSuffix: true })}
              </span>
            </div>

            {!compact && (
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {tweet.account.member && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#50e2c3]/20 text-[#50e2c3] border border-[#50e2c3]/30">
                    {ACCOUNT_TYPE_ICON[tweet.account.accountType]}
                    {tweet.account.member.name}
                  </span>
                )}
                {config && (
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${config.bg} ${config.color}`}>
                    {config.icon}
                    {config.label}
                  </span>
                )}
              </div>
            )}

            <p className={`text-zinc-200 ${compact ? 'text-xs' : 'text-sm'} leading-relaxed whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
              {tweet.text}
            </p>

            {!expanded && isLong && (
              <button className="text-[#50e2c3] text-xs mt-1 flex items-center gap-1 hover:underline">
                Show more <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          {tweet.urls && tweet.urls.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Links</p>
              <div className="flex flex-wrap gap-2">
                {tweet.urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#50e2c3] hover:underline truncate max-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {url.replace(/^https?:\/\//, '').slice(0, 40)}...
                  </a>
                ))}
              </div>
            </div>
          )}

          {tweet.hashtags && tweet.hashtags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {tweet.hashtags.map((tag, i) => (
                  <span key={i} className="text-xs text-blue-400">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {tweet.replyCount}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="w-3.5 h-3.5" />
                {tweet.retweetCount}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {tweet.likeCount}
              </span>
              {tweet.viewCount && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {tweet.viewCount > 1000 ? `${(tweet.viewCount / 1000).toFixed(1)}K` : tweet.viewCount}
                </span>
              )}
            </div>

            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-[#50e2c3] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View on X <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <button 
            onClick={() => setExpanded(false)}
            className="mt-3 text-xs text-zinc-500 hover:text-white flex items-center gap-1"
          >
            <ChevronUp className="w-3 h-3" /> Collapse
          </button>
        </div>
      )}

      {!expanded && !compact && (
        <div className="flex items-center gap-4 text-xs text-zinc-600 mt-3 pt-3 border-t border-white/[0.04]">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {tweet.replyCount}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="w-3 h-3" />
            {tweet.retweetCount}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {tweet.likeCount}
          </span>
        </div>
      )}
    </div>
  );
}

export function CategoryCard({ 
  title, 
  icon, 
  tweets, 
  color,
  emptyMessage = 'No tweets'
}: { 
  title: string; 
  icon: React.ReactNode; 
  tweets: Tweet[];
  color: string;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-white/[0.01] border border-white/[0.06] rounded-xl overflow-hidden h-full flex flex-col">
      <div className={`flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] ${color}`}>
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="text-zinc-500 text-xs ml-auto">{tweets.length}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tweets.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">{emptyMessage}</p>
        ) : (
          tweets.slice(0, 10).map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))
        )}
      </div>
    </div>
  );
}

export function CompactTweetCard({ tweet }: { tweet: Tweet }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[tweet.category];
  const tweetUrl = `https://twitter.com/${tweet.account.username}/status/${tweet.tweetId}`;

  if (expanded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
        <div className="relative w-full max-w-lg max-h-[80vh] overflow-auto rounded-xl border border-white/[0.1] bg-[#0F0F12] shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#0F0F12]">
            <div className="flex items-center gap-2">
              {config && (
                <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${config.bg} ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
              )}
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {tweet.account.profileImageUrl ? (
                  <img 
                    src={tweet.account.profileImageUrl} 
                    alt={tweet.account.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {tweet.account.displayName[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{tweet.account.displayName}</p>
                <p className="text-zinc-500 text-sm">@{tweet.account.username}</p>
                {tweet.account.personRole && (
                  <p className="text-zinc-600 text-xs mt-0.5">{tweet.account.personRole}</p>
                )}
              </div>
            </div>

            <p className="text-zinc-100 text-base leading-relaxed whitespace-pre-wrap mb-4">
              {tweet.text}
            </p>

            <p className="text-zinc-500 text-sm mb-4">
              {new Date(tweet.publishedAt).toLocaleString()}
            </p>

            {tweet.urls && tweet.urls.length > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Links in tweet</p>
                <div className="space-y-1">
                  {tweet.urls.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-[#50e2c3] hover:underline truncate"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 py-3 border-t border-b border-white/[0.06] text-zinc-400">
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">{tweet.replyCount}</span>
              </span>
              <span className="flex items-center gap-2">
                <Repeat2 className="w-4 h-4" />
                <span className="text-sm">{tweet.retweetCount}</span>
              </span>
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span className="text-sm">{tweet.likeCount}</span>
              </span>
              {tweet.viewCount && (
                <span className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">
                    {tweet.viewCount > 1000 ? `${(tweet.viewCount / 1000).toFixed(1)}K` : tweet.viewCount}
                  </span>
                </span>
              )}
            </div>

            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View original on X
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setExpanded(true)}
      className="w-full text-left p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <span className="text-[10px] font-bold text-white">
            {tweet.account.displayName[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className="font-medium text-white text-xs truncate">
              {tweet.account.displayName}
            </span>
            <span className="text-zinc-600 text-[10px]">
              {formatDistanceToNow(new Date(tweet.publishedAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-zinc-400 text-xs line-clamp-2 leading-relaxed">
            {tweet.text}
          </p>
        </div>
      </div>
    </button>
  );
}
