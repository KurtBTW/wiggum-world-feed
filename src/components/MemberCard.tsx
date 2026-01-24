'use client';

import Link from 'next/link';
import { Building2, ExternalLink } from 'lucide-react';

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

const CATEGORY_COLORS: Record<string, string> = {
  lending: 'bg-blue-500/20 text-blue-400',
  dex: 'bg-purple-500/20 text-purple-400',
  derivatives: 'bg-orange-500/20 text-orange-400',
  infrastructure: 'bg-green-500/20 text-green-400',
  analytics: 'bg-cyan-500/20 text-cyan-400',
  tooling: 'bg-pink-500/20 text-pink-400',
};

const STAGE_COLORS: Record<string, string> = {
  live: 'bg-[#50e2c3]/20 text-[#50e2c3]',
  testnet: 'bg-yellow-500/20 text-yellow-400',
  building: 'bg-zinc-500/20 text-zinc-400',
};

export function MemberCard({ member }: { member: Member }) {
  return (
    <Link
      href={`/network/${member.slug}`}
      className="group block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-[#50e2c3]/30 hover:bg-white/[0.04] transition-all"
    >
      <div className="flex items-start gap-4">
        {member.logo ? (
          <img
            src={member.logo}
            alt={member.name}
            className="w-14 h-14 rounded-xl object-contain bg-white/[0.05] flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-zinc-600" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white group-hover:text-[#50e2c3] transition-colors truncate">
              {member.name}
            </h3>
            <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-[#50e2c3] transition-colors flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${CATEGORY_COLORS[member.category] || 'bg-zinc-500/20 text-zinc-400'}`}>
              {member.category}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${STAGE_COLORS[member.stage] || 'bg-zinc-500/20 text-zinc-400'}`}>
              {member.stage}
            </span>
          </div>
          
          <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
            {member.description}
          </p>
          
          {member.seeking.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.seeking.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.05] text-zinc-500"
                >
                  Seeking: {item.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
