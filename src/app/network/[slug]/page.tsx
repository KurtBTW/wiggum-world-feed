'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, Globe, Twitter, MessageCircle, Github,
  ExternalLink, Building2, Calendar, Tag, Users, Newspaper,
  Network, Wallet, User, Flame, Terminal
} from 'lucide-react';

interface TeamMember {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  personName: string | null;
  personRole: string | null;
}

interface Tweet {
  id: string;
  tweetId: string;
  text: string;
  category: string;
  publishedAt: string;
  likeCount: number;
  account: {
    username: string;
    displayName: string;
    profileImageUrl: string | null;
  };
}

interface Member {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string;
  twitter: string | null;
  discord: string | null;
  github: string | null;
  description: string;
  category: string;
  stage: string;
  seeking: string[];
  offering: string[];
  joinedAt: string;
  twitterAccounts?: TeamMember[];
}

const CATEGORY_LABELS: Record<string, string> = {
  lending: 'Lending',
  dex: 'DEX',
  derivatives: 'Derivatives',
  infrastructure: 'Infrastructure',
  analytics: 'Analytics',
  tooling: 'Tooling',
};

const STAGE_LABELS: Record<string, string> = {
  live: 'Live',
  testnet: 'Testnet',
  building: 'Building',
};

export default function MemberProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [member, setMember] = useState<Member | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchMember();
    }
  }, [slug]);

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/network/members/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMember(data.member);
      setTweets(data.tweets || []);
    } catch (err) {
      console.error('Failed to fetch member:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Member not found</p>
          <Link href="/network" className="text-[#50e2c3] hover:underline">
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
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
            <Link
              href="/network/feed"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Command Center
            </Link>
            <Link
              href="/status"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/network"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="p-8 border-b border-white/[0.06]">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {member.logo ? (
                <img
                  src={member.logo}
                  alt={member.name}
                  className="w-24 h-24 rounded-2xl object-contain bg-white/[0.05]"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-zinc-600" />
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{member.name}</h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-[#50e2c3]/20 text-[#50e2c3]">
                    {CATEGORY_LABELS[member.category] || member.category}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/[0.1] text-zinc-300">
                    {STAGE_LABELS[member.stage] || member.stage}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-zinc-500">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#50e2c3] text-black font-medium rounded-lg hover:bg-[#3fcbac] transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    Visit Website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  
                  {member.twitter && (
                    <a
                      href={`https://twitter.com/${member.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.1] transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      {member.twitter}
                    </a>
                  )}
                  
                  {member.discord && (
                    <a
                      href={member.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.1] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Discord
                    </a>
                  )}
                  
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] text-white rounded-lg hover:bg-white/[0.1] transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-lg font-semibold text-white mb-3">About</h2>
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {member.description}
            </p>
          </div>

          {(member.seeking.length > 0 || member.offering.length > 0) && (
            <div className="p-8 border-t border-white/[0.06]">
              <div className="grid md:grid-cols-2 gap-8">
                {member.seeking.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-[#50e2c3]" />
                      Looking For
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {member.seeking.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[#50e2c3]/10 text-[#50e2c3] border border-[#50e2c3]/20"
                        >
                          {item.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {member.offering.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-purple-400" />
                      Can Offer
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {member.offering.map((item) => (
                        <span
                          key={item}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        >
                          {item.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {member.twitterAccounts && member.twitterAccounts.length > 0 && (
            <div className="p-8 border-t border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#50e2c3]" />
                Team
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {member.twitterAccounts.map((account) => (
                  <a
                    key={account.id}
                    href={`https://twitter.com/${account.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    {account.profileImageUrl ? (
                      <img
                        src={account.profileImageUrl}
                        alt={account.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white/[0.1] flex items-center justify-center">
                        <Twitter className="w-5 h-5 text-zinc-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {account.personName || account.displayName}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        {account.personRole || `@${account.username}`}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {tweets.length > 0 && (
            <div className="p-8 border-t border-white/[0.06]">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#50e2c3]" />
                Recent Updates
              </h2>
              <div className="space-y-4">
                {tweets.map((tweet) => (
                  <a
                    key={tweet.id}
                    href={`https://twitter.com/${tweet.account.username}/status/${tweet.tweetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {tweet.account.profileImageUrl ? (
                        <img
                          src={tweet.account.profileImageUrl}
                          alt={tweet.account.displayName}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-white/[0.1] flex items-center justify-center flex-shrink-0">
                          <Twitter className="w-5 h-5 text-zinc-500" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">
                            {tweet.account.displayName}
                          </span>
                          <span className="text-zinc-500 text-sm">
                            @{tweet.account.username}
                          </span>
                          <span className="text-zinc-600 text-xs">
                            {new Date(tweet.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-zinc-300 text-sm line-clamp-3">
                          {tweet.text}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tweet.category === 'ANNOUNCEMENT' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : tweet.category === 'METRICS'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-zinc-500/20 text-zinc-400'
                          }`}>
                            {tweet.category}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
