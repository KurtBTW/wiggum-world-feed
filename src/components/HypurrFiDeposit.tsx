'use client';

import { ExternalLink } from 'lucide-react';

interface HypurrFiDepositProps {
  onSuccess?: () => void;
}

export function HypurrFiDeposit({ onSuccess }: HypurrFiDepositProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Deposit USDC into HypurrFi's pooled trading vault to earn yield from automated strategies.
      </p>
      <a
        href="https://app.hypurr.fi/markets/pooled"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-[#FF6B35] to-[#F7931A] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
      >
        Open HypurrFi App
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
