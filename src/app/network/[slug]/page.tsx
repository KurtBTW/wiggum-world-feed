'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, Globe, Twitter, MessageCircle, Github,
  ExternalLink, Building2, Calendar, Tag
} from 'lucide-react';

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
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/network');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated' && slug) {
      fetchMember();
    }
  }, [authStatus, slug]);

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/network/members/${slug}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setMember(data.member);
    } catch (err) {
      console.error('Failed to fetch member:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === 'loading' || loading) {
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
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
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
        </div>
      </div>
    </div>
  );
}
