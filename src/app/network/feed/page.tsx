'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Loader2, RefreshCw, Zap, Users, User, 
  Network, Wallet, Flame, ExternalLink, Terminal,
  ChevronLeft, ChevronRight, TrendingUp, Bitcoin, Cat
} from 'lucide-react';
import { CompactTweetCard, Tweet } from '@/components/TweetCard';
import { PriceTicker } from '@/components/PriceTicker';
import { TelegramPanel } from '@/components/TelegramPanel';
import { TelegramAuth } from '@/components/TelegramAuth';
import { AssetDetail } from '@/components/AssetDetail';
import { fetchAllYields, AllYields } from '@/services/yields';
import { fetchLHYPEData } from '@/services/looping';

interface AssetConfig {
  id: string;
  symbol: string;
  name: string;
  type: 'native' | 'protocol';
  color: string;
  gradient: string;
  icon: React.ReactNode;
  imageUrl?: string;
  description: string;
  website?: string;
  twitter?: string;
  explorer?: string;
  apy?: number;
  tvl?: number;
  depositAsset?: string;
  noChart?: boolean;
  externalUrl?: string;
}

export default function FeedPage() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [telegramAuthenticated, setTelegramAuthenticated] = useState<boolean | null>(null);
  const [showTelegramAuth, setShowTelegramAuth] = useState(false);
  
  const [leftExpanded, setLeftExpanded] = useState(false);
  const [rightExpanded, setRightExpanded] = useState(false);
  
  const [yields, setYields] = useState<AllYields | null>(null);
  const [lhypeApy, setLhypeApy] = useState<number>(0);
  const [lhypeTvl, setLhypeTvl] = useState<number>(0);
  
  const [selectedAsset, setSelectedAsset] = useState<string>('hype');

  const checkTelegramAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/auth');
      const data = await res.json();
      setTelegramAuthenticated(data.authenticated);
    } catch {
      setTelegramAuthenticated(false);
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/twitter/feed?limit=100');
      if (!res.ok) throw new Error('Failed to fetch feed');
      const data = await res.json();
      setTweets(data.tweets || []);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchYields = useCallback(async () => {
    try {
      const [allYields, lhypeData] = await Promise.all([
        fetchAllYields(),
        fetchLHYPEData(),
      ]);
      setYields(allYields);
      setLhypeApy(lhypeData.apy);
      setLhypeTvl(lhypeData.tvlUsd);
    } catch (err) {
      console.error('Failed to fetch yields:', err);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    checkTelegramAuth();
    fetchYields();
  }, [fetchFeed, checkTelegramAuth, fetchYields]);

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

  const assets: AssetConfig[] = [
    {
      id: 'hypurrfi',
      symbol: 'HypurrFi',
      name: 'HypurrFi',
      type: 'protocol',
      noChart: true,
      externalUrl: 'https://app.hypurr.fi/markets/pooled',
      tvl: yields?.hypurrfi?.tvlUsd || 0,
      color: '#FF6B35',
      gradient: 'from-[#FF6B35] to-[#F7931A]',
      icon: <Cat className="w-5 h-5 text-white" />,
      imageUrl: 'https://raw.githubusercontent.com/hypurrfi/brand-assets/main/hypurrfi/hypurrfi-logo-black-bg.png',
      description: 'HypurrFi is a pooled trading vault on Hyperliquid. Deposit USDC to earn yield from automated trading strategies.',
      website: 'https://hypurr.fi',
      twitter: '@hypaboratory',
      depositAsset: 'USDC',
    },
    {
      id: 'hype',
      symbol: 'HYPE',
      name: 'Hyper Foundation',
      type: 'native',
      color: '#50e2c3',
      gradient: 'from-[#50e2c3] to-[#3fcbac]',
      icon: <TrendingUp className="w-5 h-5 text-black" />,
      imageUrl: 'https://hyperfoundation.org/favicon-32x32.png',
      description: 'Native token of the Hyperliquid L1 blockchain. Hyperliquid is a high-performance decentralized exchange with on-chain order books and instant finality.',
      website: 'https://hyperfoundation.org',
      twitter: '@HyperliquidX',
      explorer: 'https://purrsec.com',
    },
    {
      id: 'liminal',
      symbol: 'Liminal',
      name: 'Liminal',
      type: 'protocol',
      noChart: true,
      externalUrl: 'https://liminal.money/app/tokenized',
      apy: Math.max(yields?.xhype.apy || 0, yields?.xbtc.apy || 0),
      tvl: (yields?.xhype.tvlUsd || 0) + (yields?.xbtc.tvlUsd || 0),
      depositAsset: 'USDC/USDT0',
      color: '#00BF85',
      gradient: 'from-[#00BF85] to-[#008F64]',
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      imageUrl: 'https://liminal.money/landing/logo.svg',
      website: 'https://liminal.money',
      twitter: '@liminalmoney',
      description: 'Delta-neutral yield vaults for HYPE and BTC exposure. Earn yield through xHYPE and xBTC while maintaining market-neutral positioning with sophisticated hedging strategies.',
    },
    {
      id: 'khype',
      symbol: 'kHYPE',
      name: 'Kinetiq',
      type: 'protocol',
      noChart: true,
      externalUrl: 'https://kinetiq.xyz',
      apy: yields?.khype.apy || 0,
      tvl: yields?.khype.tvlUsd || 0,
      depositAsset: 'HYPE',
      color: '#a855f7',
      gradient: 'from-[#7c3aed] to-[#a855f7]',
      icon: <Zap className="w-5 h-5 text-white" />,
      imageUrl: 'https://kinetiq.xyz/favicon.ico',
      website: 'https://kinetiq.xyz',
      twitter: '@kinetiq_xyz',
      description: 'Liquid staking protocol for HyperEVM validators. Stake HYPE and receive kHYPE while earning validator rewards.',
    },
    {
      id: 'lhype',
      symbol: 'LHYPE',
      name: 'Looping',
      type: 'protocol',
      noChart: true,
      externalUrl: 'https://www.loopingcollective.org/loopedhype',
      apy: lhypeApy,
      tvl: lhypeTvl,
      depositAsset: 'HYPE',
      color: '#50e2c3',
      gradient: 'from-[#50e2c3] to-[#3fcbac]',
      icon: <TrendingUp className="w-5 h-5 text-black" />,
      imageUrl: 'https://framerusercontent.com/images/K2UdQpCavlunxHFfgFFCpaiPT68.svg',
      website: 'https://loopingcollective.org',
      twitter: '@LoopingFi',
      description: 'The first Liquid Looping Token designed to maximize HYPE yield through an automated looping strategy. Deposit HYPE, stHYPE, or kHYPE to receive LHYPE.',
    },
  ];

  const currentAsset = assets.find(a => a.id === selectedAsset) || assets[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  const leftWidth = leftExpanded ? 'w-96' : 'w-72';
  const rightWidth = rightExpanded ? 'w-[420px]' : 'w-80';

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a]">
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
              href="/network/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/network"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Users className="w-4 h-4" />
              Directory
            </Link>
            <a
              href="https://hypurrrelevancy.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Flame className="w-4 h-4" />
              Major News
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#50e2c3]/10 text-[#50e2c3]">
              <Terminal className="w-4 h-4" />
              Command Center
            </span>
            <Link
              href="/status"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </div>
        </div>
        
        <ConnectButton />
      </nav>

      <PriceTicker />

      <div className="border-b border-white/[0.06] bg-[#0a0a0a] px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">Partnered Protocols</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {assets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${
                  selectedAsset === asset.id 
                    ? 'bg-white/[0.06] border-white/[0.15]' 
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
                }`}
              >
                {asset.imageUrl ? (
                  <img src={asset.imageUrl} alt={asset.name} className="w-7 h-7 rounded-lg object-contain" />
                ) : (
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${asset.gradient} flex items-center justify-center`}>
                    {asset.icon}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{asset.symbol}</p>
                </div>
                {asset.type === 'protocol' && asset.apy !== undefined && !asset.noChart && (
                  <div className="text-right pl-2 border-l border-white/[0.06]">
                    <p className="text-sm font-bold text-[#50e2c3]">{asset.apy > 0 ? `${asset.apy.toFixed(1)}%` : '—'}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        <aside className={`${leftWidth} border-r border-white/[0.06] flex flex-col transition-all duration-300`} style={{ height: 'calc(100vh - 140px)' }}>
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#fbbf24]" />
              <h2 className="font-medium text-white text-sm">Live Tweets Feed</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors disabled:opacity-50"
                title="Refresh feed"
              >
                <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setLeftExpanded(!leftExpanded)}
                className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                title={leftExpanded ? 'Collapse' : 'Expand'}
              >
                {leftExpanded ? (
                  <ChevronLeft className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tweets.length === 0 ? (
              <div className="p-4 text-center text-zinc-500 text-sm">
                <p className="mb-2">No tweets yet</p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-[#50e2c3] hover:underline"
                >
                  Fetch Tweets
                </button>
              </div>
            ) : (
              tweets.slice(0, leftExpanded ? 50 : 25).map((tweet) => (
                <CompactTweetCard key={tweet.id} tweet={tweet} />
              ))
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden">
          <AssetDetail 
            asset={currentAsset} 
            tweets={tweets}
            onDepositSuccess={fetchYields}
          />
        </main>

        <aside className={`${rightWidth} border-l border-white/[0.06] flex flex-col transition-all duration-300`} style={{ height: 'calc(100vh - 140px)' }}>
          <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <h2 className="font-medium text-white text-sm">Telegram</h2>
            </div>
            <button
              onClick={() => setRightExpanded(!rightExpanded)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
              title={rightExpanded ? 'Collapse' : 'Expand'}
            >
              {rightExpanded ? (
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-zinc-400" />
              )}
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {showTelegramAuth ? (
              <TelegramAuth 
                onAuthenticated={() => {
                  setShowTelegramAuth(false);
                  setTelegramAuthenticated(true);
                }} 
              />
            ) : telegramAuthenticated ? (
              <TelegramPanel />
            ) : telegramAuthenticated === false ? (
              <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                <svg className="w-12 h-12 text-[#0088cc] mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <h3 className="text-lg font-bold text-white mb-2">Connect Telegram</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Link your Telegram to see messages from your groups and channels here.
                </p>
                <button
                  onClick={() => setShowTelegramAuth(true)}
                  className="px-4 py-2 bg-[#0088cc] text-white font-medium rounded-lg hover:bg-[#0088cc]/90 transition-colors"
                >
                  Connect Now
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-[#0088cc] animate-spin" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
