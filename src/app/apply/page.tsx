'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/network');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
    </div>
  );
}
