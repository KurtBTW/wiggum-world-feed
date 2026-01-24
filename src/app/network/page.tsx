'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, Search, Users } from 'lucide-react';
import { MemberCard } from '@/components/MemberCard';

interface Member {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string;
  description: string;
  category: string;
  stage: string;
  seeking: string[];
  offering: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'lending', label: 'Lending' },
  { id: 'dex', label: 'DEX' },
  { id: 'derivatives', label: 'Derivatives' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'tooling', label: 'Tooling' },
];

const STAGES = [
  { id: 'all', label: 'All Stages' },
  { id: 'live', label: 'Live' },
  { id: 'testnet', label: 'Testnet' },
  { id: 'building', label: 'Building' },
];

export default function NetworkPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stage, setStage] = useState('all');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/network');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchMembers();
    }
  }, [authStatus, category, stage]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (stage !== 'all') params.set('stage', stage);
      
      const res = await fetch(`/api/network/members?${params}`);
      const data = await res.json();
      
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = search
    ? members.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06] sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#50e2c3]" />
            <div>
              <h1 className="text-xl font-bold text-white">Member Directory</h1>
              <p className="text-xs text-zinc-500">Browse network members</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#50e2c3]/50 appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1a1a]">
                  {c.label}
                </option>
              ))}
            </select>
            
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#50e2c3]/50 appearance-none cursor-pointer"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1a1a1a]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-zinc-500" />
          <span className="text-zinc-400">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No members found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-[#50e2c3] hover:underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
