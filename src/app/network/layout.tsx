'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Network, Users, User, 
  ChevronRight, Wallet, Flame, ExternalLink, Terminal 
} from 'lucide-react';

const APP_VERSION = 'v1.0.9';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/network/dashboard', label: 'Dashboard', icon: <Wallet className="w-5 h-5" /> },
  { href: '/network', label: 'Directory', icon: <Users className="w-5 h-5" /> },
  { href: 'https://hypurrrelevancy.vercel.app/', label: 'Major News', icon: <Flame className="w-5 h-5" />, external: true },
  { href: '/network/feed', label: 'Command Center', icon: <Terminal className="w-5 h-5" /> },
  { href: '/status', label: 'Portfolio', icon: <User className="w-5 h-5" /> },
];

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isDashboardPage = pathname === '/network/dashboard';
  const isProfilePage = pathname.match(/^\/network\/[^/]+$/) && !isDashboardPage && pathname !== '/network';
  const isFeedPage = pathname === '/network/feed';
  
  if (isProfilePage || isFeedPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-64 border-r border-white/[0.06] flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/[0.06]">
          <Link href="/network" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
              <Network className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Last Network</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">DeFi on Hyperliquid</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = !item.external && (pathname === item.href || 
              (item.href === '/network' && pathname === '/network'));
            
            const className = `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all
              ${isActive 
                ? 'bg-[#50e2c3]/10 text-[#50e2c3] border border-[#50e2c3]/20' 
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
              }
            `;
            
            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </a>
              );
            }
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={className}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="px-4 py-2 text-center">
            <span className="text-[10px] text-zinc-600 font-mono">{APP_VERSION}</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
