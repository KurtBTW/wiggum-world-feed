'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Loader2, ArrowDown, ExternalLink, Zap, Wallet, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { KINETIQ_CONTRACTS, fetchKinetiqData, type KinetiqData } from '@/services/kinetiq';
import { KINETIQ_STAKING_MANAGER_ABI, KINETIQ_ACCOUNTANT_ABI } from '@/lib/abis';

interface KinetiqDepositProps {
  onSuccess?: () => void;
}

export function KinetiqDeposit({ onSuccess }: KinetiqDepositProps) {
  const { address, isConnected } = useAccount();
  const { data: hypeBalance } = useBalance({ address });
  
  const [amount, setAmount] = useState('');
  const [kinetiqData, setKinetiqData] = useState<KinetiqData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const parsedAmount = amount ? parseFloat(amount) : 0;
  const depositAmount = parsedAmount > 0 ? parseEther(amount) : BigInt(0);

  const { data: minStakeAmountData } = useReadContract({
    address: KINETIQ_CONTRACTS.STAKING_MANAGER,
    abi: KINETIQ_STAKING_MANAGER_ABI,
    functionName: 'minStakeAmount',
  });

  const minStakeAmount = minStakeAmountData ? parseFloat(formatEther(minStakeAmountData)) : 0;
  const isBelowMinimum = parsedAmount > 0 && parsedAmount < minStakeAmount;

  const { data: expectedKhype } = useReadContract({
    address: KINETIQ_CONTRACTS.STAKING_ACCOUNTANT,
    abi: KINETIQ_ACCOUNTANT_ABI,
    functionName: 'HYPEToKHYPE',
    args: [depositAmount],
    query: {
      enabled: depositAmount > BigInt(0),
    },
  });

  useEffect(() => {
    fetchKinetiqData()
      .then(setKinetiqData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const estimatedKHYPE = expectedKhype 
    ? parseFloat(formatEther(expectedKhype))
    : parsedAmount > 0 ? parsedAmount : 0;

  const { error: simulateError } = useSimulateContract({
    address: KINETIQ_CONTRACTS.STAKING_MANAGER,
    abi: KINETIQ_STAKING_MANAGER_ABI,
    functionName: 'stake',
    value: depositAmount,
    query: {
      enabled: !!address && depositAmount > BigInt(0) && !isBelowMinimum,
    },
  });

  const handleDeposit = async () => {
    if (!address || !amount || parsedAmount <= 0) return;

    writeContract({
      address: KINETIQ_CONTRACTS.STAKING_MANAGER,
      abi: KINETIQ_STAKING_MANAGER_ABI,
      functionName: 'stake',
      value: depositAmount,
    });
  };

  const handleMaxClick = () => {
    if (hypeBalance) {
      const maxAmount = parseFloat(formatEther(hypeBalance.value));
      const safeMax = Math.max(0, maxAmount - 0.01).toFixed(6);
      setAmount(safeMax);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#a855f7] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Kinetiq Staked HYPE</h3>
            <p className="text-xs text-zinc-500">Kinetiq</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {kinetiqData && (
            <div className="text-right">
              <p className="text-lg font-bold text-[#a855f7]">{kinetiqData.apy.toFixed(2)}% APY</p>
              <p className="text-xs text-zinc-500">Liquid staking</p>
            </div>
          )}
          <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-white/[0.06]">
          <div className="space-y-2 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">You deposit</span>
              <span className="text-zinc-500">
                Balance: {hypeBalance ? parseFloat(formatEther(hypeBalance.value)).toFixed(4) : '0'} HYPE
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-medium text-white placeholder-zinc-600 outline-none"
              />
              <button
                onClick={handleMaxClick}
                className="px-2 py-1 text-xs font-medium text-[#a855f7] hover:bg-[#a855f7]/10 rounded transition-colors"
              >
                MAX
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] rounded-lg">
                <Wallet className="w-4 h-4 text-zinc-400" />
                <span className="font-medium text-white">HYPE</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-zinc-500" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">You receive</span>
              <span className="text-zinc-500">
                Rate: ~1:1 (rebasing)
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <input
                type="text"
                value={estimatedKHYPE > 0 ? estimatedKHYPE.toFixed(6) : ''}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-medium text-white placeholder-zinc-600 outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#a855f7]/10 border border-[#a855f7]/20 rounded-lg">
                <Zap className="w-4 h-4 text-[#a855f7]" />
                <span className="font-medium text-[#a855f7]">kHYPE</span>
              </div>
            </div>
          </div>

          {isSuccess ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Staking successful!</span>
              <a
                href={`https://purrsec.com/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-green-400 hover:text-green-300"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : isBelowMinimum ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm">
                Minimum stake: {minStakeAmount.toFixed(2)} HYPE
              </span>
            </div>
          ) : simulateError ? (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 text-sm">
                Simulation: {(simulateError as Error).message?.slice(0, 60) || 'Error'}
              </span>
            </div>
          ) : writeError ? (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm truncate">
                {writeError.message.slice(0, 50)}...
              </span>
            </div>
          ) : null}

          <button
            onClick={handleDeposit}
            disabled={!amount || parsedAmount <= 0 || isPending || isConfirming || loading || isBelowMinimum}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isPending ? 'Confirm in Wallet...' : 'Processing...'}
              </>
            ) : (
              'Stake HYPE'
            )}
          </button>

          <a
            href="https://kinetiq.xyz/stake-hype"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Learn more about Kinetiq
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
