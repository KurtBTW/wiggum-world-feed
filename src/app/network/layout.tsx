'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Network, Users, Newspaper, User, LogOut, 
  ChevronRight, Shield, Loader2, Wallet 
} from 'lucide-react';

const APP_VERSION = 'v1.0.2-lhype-fix';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/network/dashboard', label: 'Dashboard', icon: <Wallet className="w-5 h-5" /> },
  { href: '/network', label: 'Directory', icon: <Users className="w-5 h-5" /> },
  { href: '/network/feed', label: 'News Feed', icon: <Newspaper className="w-5 h-5" /> },
  { href: '/status', label: 'My Profile', icon: <User className="w-5 h-5" /> },
  { href: '/admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, adminOnly: true },
];

export default function NetworkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const isDashboardPage = pathname === '/network/dashboard';
  const isProfilePage = pathname.match(/^\/network\/[^/]+$/) && !isDashboardPage;
  const isFeedPage = pathname === '/network/feed';
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  if (isProfilePage || isFeedPage) {
    return <>{children}</>;
  }

  const userRole = (session?.user as { role?: string })?.role;
  const isAdmin = userRole === 'ADMIN';

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
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Member Portal</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const isActive = pathname === item.href || 
              (item.href === '/network' && pathname === '/network');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-[#50e2c3]/10 text-[#50e2c3] border border-[#50e2c3]/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
              <span className="text-sm font-bold text-black">
                {session?.user?.email?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.email}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {userRole || 'Member'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="mt-2 w-full flex items-center gap-3 px-4 py-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Sign Out</span>
          </button>
          
          <div className="mt-3 px-4 py-2 text-center">
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
