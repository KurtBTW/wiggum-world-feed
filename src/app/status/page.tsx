'use client';

import Link from 'next/link';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Wallet, TrendingUp, Zap, Bitcoin, DollarSign, Network, Users, Terminal, Flame, ExternalLink
} from 'lucide-react';
import { LOOPING_CONTRACTS } from '@/services/looping';
import { KINETIQ_CONTRACTS } from '@/services/kinetiq';
import { LIMINAL_CONTRACTS } from '@/services/liminal';
import { LHYPE_TOKEN_ABI, KINETIQ_TOKEN_ABI, LIMINAL_SHARE_MANAGER_ABI, ERC20_ABI } from '@/lib/abis';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  
  const { data: hypeBalance } = useBalance({ address });
  
  const { data: usdcBalance } = useReadContract({
    address: LIMINAL_CONTRACTS.STABLECOINS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  
  const { data: usdt0Balance } = useReadContract({
    address: LIMINAL_CONTRACTS.STABLECOINS.USDT0,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: lhypeBalance } = useReadContract({
    address: LOOPING_CONTRACTS.LHYPE,
    abi: LHYPE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: khypeBalance } = useReadContract({
    address: KINETIQ_CONTRACTS.KHYPE,
    abi: KINETIQ_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: xhypeBalance } = useReadContract({
    address: LIMINAL_CONTRACTS.xHYPE.SHARE_MANAGER,
    abi: LIMINAL_SHARE_MANAGER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: xbtcBalance } = useReadContract({
    address: LIMINAL_CONTRACTS.xBTC.SHARE_MANAGER,
    abi: LIMINAL_SHARE_MANAGER_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const formattedHype = hypeBalance ? parseFloat(formatUnits(hypeBalance.value, 18)) : 0;
  const formattedUsdc = usdcBalance ? parseFloat(formatUnits(usdcBalance as bigint, 6)) : 0;
  const formattedUsdt0 = usdt0Balance ? parseFloat(formatUnits(usdt0Balance as bigint, 6)) : 0;
  const formattedLhype = lhypeBalance ? parseFloat(formatUnits(lhypeBalance as bigint, 18)) : 0;
  const formattedKhype = khypeBalance ? parseFloat(formatUnits(khypeBalance as bigint, 18)) : 0;
  const formattedXhype = xhypeBalance ? parseFloat(formatUnits(xhypeBalance as bigint, 18)) : 0;
  const formattedXbtc = xbtcBalance ? parseFloat(formatUnits(xbtcBalance as bigint, 18)) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <nav className="h-14 border-b border-white/[0.06] bg-[#0a0a0a] flex items-center px-4 justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/network" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
              <Network className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-white">Last Network</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <Link
              href="/network/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Wallet className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/network"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Users className="w-4 h-4" />
              Directory
            </Link>
            <a
              href="https://hypurrrelevancy.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Flame className="w-4 h-4" />
              Major News
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
            <Link
              href="/network/feed"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Terminal className="w-4 h-4" />
              Command Center
            </Link>
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#50e2c3]/10 text-[#50e2c3]">
              <Wallet className="w-4 h-4" />
              Profile
            </span>
          </div>
        </div>
        
        <ConnectButton />
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex items-center gap-3 mb-8">
          <Wallet className="w-6 h-6 text-[#50e2c3]" />
          <h1 className="text-2xl font-bold text-white">Your Portfolio</h1>
        </div>

        {!isConnected ? (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-12 text-center">
            <Wallet className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-zinc-400 mb-6">Connect your wallet to view your portfolio and balances</p>
            <ConnectButton />
          </div>
        ) : (
          <>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Native Assets</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#50e2c3]/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-[#50e2c3]" />
                    </div>
                    <span className="text-sm text-zinc-400">HYPE</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formattedHype.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-zinc-400">USDC</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formattedUsdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <span className="text-sm text-zinc-400">USDT0</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formattedUsdt0.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {(formattedKhype > 0 || formattedLhype > 0 || formattedXhype > 0 || formattedXbtc > 0) && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Staked Positions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formattedKhype > 0 && (
                    <div className="bg-white/[0.03] border border-[#a855f7]/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm text-zinc-400">kHYPE</span>
                          <p className="text-xs text-zinc-600">Kinetiq</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formattedKhype.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {formattedLhype > 0 && (
                    <div className="bg-white/[0.03] border border-[#50e2c3]/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-black" />
                        </div>
                        <div>
                          <span className="text-sm text-zinc-400">LHYPE</span>
                          <p className="text-xs text-zinc-600">Looping</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formattedLhype.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {formattedXhype > 0 && (
                    <div className="bg-white/[0.03] border border-[#f59e0b]/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm text-zinc-400">xHYPE</span>
                          <p className="text-xs text-zinc-600">Liminal</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formattedXhype.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  
                  {formattedXbtc > 0 && (
                    <div className="bg-white/[0.03] border border-[#f7931a]/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#f7931a] to-[#c67a15] flex items-center justify-center">
                          <Bitcoin className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="text-sm text-zinc-400">xBTC</span>
                          <p className="text-xs text-zinc-600">Liminal</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {formattedXbtc.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formattedKhype === 0 && formattedLhype === 0 && formattedXhype === 0 && formattedXbtc === 0 && (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center">
                <p className="text-zinc-400 mb-4">No staked positions yet</p>
                <Link
                  href="/network/feed"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
                >
                  Explore Yield Opportunities
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
