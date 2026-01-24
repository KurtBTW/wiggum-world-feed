'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, RefreshCw, Newspaper, Megaphone, BarChart3, 
  MessageSquare, BookOpen, AlertCircle, Zap, Users, User, 
  Shield, LogOut, Network
} from 'lucide-react';
import { CategoryCard, CompactTweetCard, Tweet } from '@/components/TweetCard';
import { PriceTicker } from '@/components/PriceTicker';

export default function FeedPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === 'ADMIN';
  
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [grouped, setGrouped] = useState<Record<string, Tweet[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/network/feed');
    }
  }, [authStatus, router]);

  const fetchFeed = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch('/api/twitter/feed?limit=100');
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      setTweets(data.tweets || []);
      setGrouped(data.grouped || {});
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      setError('Failed to load feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchFeed();
    }
  }, [authStatus, fetchFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/twitter/ingest', { method: 'POST' });
      setTimeout(fetchFeed, 3000);
    } catch (err) {
      console.error('Failed to refresh:', err);
      setRefreshing(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  if (error || tweets.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 mb-4">{error || 'No tweets yet'}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-6 py-3 bg-[#50e2c3] text-black font-medium rounded-lg hover:bg-[#3fcbac] transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Fetching...' : 'Fetch Tweets'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="h-14 border-b border-white/[0.06] bg-[#0a0a0a] flex items-center px-4 justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/network" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
              <Network className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-white">Last Network</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link
              href="/network"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Users className="w-4 h-4" />
              Directory
            </Link>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#50e2c3]/10 text-[#50e2c3]">
              <Newspaper className="w-4 h-4" />
              Feed
            </span>
            <Link
              href="/status"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </nav>

      <PriceTicker />

      <div className="flex-1 flex">
        <aside className="w-80 border-r border-white/[0.06] flex flex-col" style={{ height: 'calc(100vh - 88px)' }}>
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#fbbf24]" />
            <h2 className="font-semibold text-white">Latest</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {tweets.slice(0, 30).map((tweet) => (
              <CompactTweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="w-6 h-6 text-[#50e2c3]" />
            <div>
              <h1 className="text-xl font-bold text-white">Network Feed</h1>
              <p className="text-xs text-zinc-500">
                {tweets.length} tweets from network protocols & teams
              </p>
            </div>
          </div>
        </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4" style={{ height: 'calc(100vh - 232px)' }}>
            <CategoryCard
              title="Announcements"
              icon={<Megaphone className="w-4 h-4" />}
              tweets={grouped.ANNOUNCEMENT || []}
              color="text-green-400"
              emptyMessage="No announcements"
            />
            <CategoryCard
              title="Metrics & Data"
              icon={<BarChart3 className="w-4 h-4" />}
              tweets={grouped.METRICS || []}
              color="text-blue-400"
              emptyMessage="No metrics"
            />
            <CategoryCard
              title="Commentary"
              icon={<MessageSquare className="w-4 h-4" />}
              tweets={grouped.COMMENTARY || []}
              color="text-purple-400"
              emptyMessage="No commentary"
            />
            <CategoryCard
              title="Threads"
              icon={<BookOpen className="w-4 h-4" />}
              tweets={grouped.THREAD || []}
              color="text-amber-400"
              emptyMessage="No threads"
            />
          </div>
        </main>
      </div>
    </div>
  );
}
