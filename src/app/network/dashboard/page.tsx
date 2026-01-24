'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { formatUnits } from 'viem';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#50e2c3]/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-[#50e2c3]" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">HYPE Balance</p>
                  <p className="text-2xl font-bold text-white">
                    {balanceLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : balance ? (
                      `${parseFloat(formatUnits(balance.value, balance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${balance.symbol}`
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
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Vault Positions</p>
                  <p className="text-2xl font-bold text-white">—</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600">Coming soon</p>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-zinc-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-white">—</p>
                </div>
              </div>
              <p className="text-xs text-zinc-600">Coming soon</p>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                disabled
                className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-left opacity-50 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-[#50e2c3]/10 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5 text-[#50e2c3]" />
                </div>
                <div>
                  <p className="font-medium text-white">Deposit to Vault</p>
                  <p className="text-sm text-zinc-500">Earn yield on your HYPE</p>
                </div>
              </button>

              <button
                disabled
                className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl text-left opacity-50 cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="font-medium text-white">Withdraw from Vault</p>
                  <p className="text-sm text-zinc-500">Retrieve your deposits</p>
                </div>
              </button>
            </div>
          </div>
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
