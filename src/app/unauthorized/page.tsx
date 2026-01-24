'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldX, ArrowLeft, Loader2 } from 'lucide-react';
import { Suspense } from 'react';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const getMessage = () => {
    switch (reason) {
      case 'members_only':
        return {
          title: 'Members Only',
          description: 'This area is only accessible to approved network members.',
          action: 'Apply to join the network to gain access.',
          link: '/apply',
          linkText: 'Apply to Join',
        };
      case 'admins_only':
        return {
          title: 'Admin Access Required',
          description: 'This area is restricted to network administrators.',
          action: 'If you believe this is an error, please contact support.',
          link: '/',
          linkText: 'Go Home',
        };
      default:
        return {
          title: 'Access Denied',
          description: 'You do not have permission to access this page.',
          action: 'Please sign in or contact support if you need access.',
          link: '/',
          linkText: 'Go Home',
        };
    }
  };

  const message = getMessage();

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">{message.title}</h1>
        <p className="text-zinc-400 mb-4">{message.description}</p>
        <p className="text-zinc-500 text-sm mb-8">{message.action}</p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={message.link}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
          >
            {message.linkText}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-white/[0.1] text-zinc-300 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UnauthorizedContent />
    </Suspense>
  );
}
