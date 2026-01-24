'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { Wallet, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { formatUnits } from 'viem';
import { LoopingDeposit } from '@/components/LoopingDeposit';
import { LOOPING_CONTRACTS } from '@/services/looping';
import { LHYPE_TOKEN_ABI } from '@/lib/abis';
import { useState } from 'react';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: hypeBalance, isLoading: hypeLoading, refetch: refetchHype } = useBalance({
    address,
  });

  const { data: lhypeBalance, isLoading: lhypeLoading, refetch: refetchLhype } = useReadContract({
    address: LOOPING_CONTRACTS.LHYPE,
    abi: LHYPE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const handleDepositSuccess = () => {
    setTimeout(() => {
      refetchHype();
      refetchLhype();
      setRefreshKey(k => k + 1);
    }, 2000);
  };

  const formattedLhype = lhypeBalance 
    ? parseFloat(formatUnits(lhypeBalance as bigint, 18))
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-zinc-500">Manage your HyperEVM wallet and positions</p>
        </header>

        <div className="mb-8">
          <ConnectButton />
        </div>

        {isConnected && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#50e2c3]/10 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-[#50e2c3]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">HYPE Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {hypeLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : hypeBalance ? (
                        `${parseFloat(formatUnits(hypeBalance.value, hypeBalance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} HYPE`
                      ) : (
                        '0 HYPE'
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-zinc-600 font-mono truncate">
                  {address}
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">LHYPE Balance</p>
                    <p className="text-2xl font-bold text-white">
                      {lhypeLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        `${formattedLhype.toLocaleString(undefined, { maximumFractionDigits: 4 })} LHYPE`
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">Looped HYPE earning yield</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Total Value</p>
                    <p className="text-2xl font-bold text-white">
                      {hypeLoading || lhypeLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        `${(
                          (hypeBalance ? parseFloat(formatUnits(hypeBalance.value, 18)) : 0) +
                          formattedLhype * 1.015
                        ).toLocaleString(undefined, { maximumFractionDigits: 2 })} HYPE`
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600">Combined portfolio value</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Deposit</h2>
                <LoopingDeposit key={refreshKey} onSuccess={handleDepositSuccess} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Your Positions</h2>
                {formattedLhype > 0 ? (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-black" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Looped HYPE</p>
                          <p className="text-sm text-zinc-500">Looping Collective</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formattedLhype.toLocaleString(undefined, { maximumFractionDigits: 4 })} LHYPE
                        </p>
                        <p className="text-sm text-zinc-500">
                          ≈ {(formattedLhype * 1.015).toLocaleString(undefined, { maximumFractionDigits: 4 })} HYPE
                        </p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Estimated APY</span>
                        <span className="text-[#50e2c3] font-medium">~3.42%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                    <TrendingUp className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <p className="text-zinc-400 mb-2">No positions yet</p>
                    <p className="text-zinc-600 text-sm">
                      Deposit HYPE to start earning yield
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {!isConnected && (
          <div className="mt-8 text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
            <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-zinc-500 max-w-md mx-auto">
              Connect your wallet to view your HYPE balance and manage your vault positions on HyperEVM.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
