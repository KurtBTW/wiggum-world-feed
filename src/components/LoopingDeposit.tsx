'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useSimulateContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Loader2, ArrowDown, ExternalLink, TrendingUp, Wallet, CheckCircle, AlertCircle } from 'lucide-react';
import { LOOPING_CONTRACTS, fetchLHYPEData, type LHYPEData } from '@/services/looping';
import { LHYPE_DEPOSITOR_ABI } from '@/lib/abis';

interface LoopingDepositProps {
  onSuccess?: () => void;
}

export function LoopingDeposit({ onSuccess }: LoopingDepositProps) {
  const { address, isConnected } = useAccount();
  const { data: hypeBalance } = useBalance({ address });
  
  const [amount, setAmount] = useState('');
  const [lhypeData, setLhypeData] = useState<LHYPEData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    fetchLHYPEData()
      .then(setLhypeData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isSuccess && onSuccess) {
      onSuccess();
    }
  }, [isSuccess, onSuccess]);

  const parsedAmount = amount ? parseFloat(amount) : 0;
  const depositAmount = parsedAmount > 0 ? parseEther(amount) : BigInt(0);
  const estimatedLHYPE = lhypeData && parsedAmount > 0
    ? parsedAmount / lhypeData.exchangeRate
    : 0;

  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: LOOPING_CONTRACTS.DEPOSITOR,
    abi: LHYPE_DEPOSITOR_ABI,
    functionName: 'depositNative',
    args: [depositAmount, BigInt(0), address!, '0x'],
    value: depositAmount,
    query: {
      enabled: !!address && depositAmount > BigInt(0),
    },
  });

  const handleDeposit = async () => {
    if (!address || !amount || parsedAmount <= 0) return;

    writeContract({
      address: LOOPING_CONTRACTS.DEPOSITOR,
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative',
      args: [depositAmount, BigInt(0), address, '0x'],
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
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#50e2c3] to-[#3fcbac] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Looped HYPE</h3>
            <p className="text-xs text-zinc-500">Earn yield on your HYPE</p>
          </div>
        </div>
        {lhypeData && (
          <div className="text-right">
            <p className="text-lg font-bold text-[#50e2c3]">{lhypeData.apy.toFixed(2)}% APY</p>
            <p className="text-xs text-zinc-500">${(lhypeData.tvlUsd / 1_000_000).toFixed(2)}M TVL</p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="space-y-2">
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
              className="px-2 py-1 text-xs font-medium text-[#50e2c3] hover:bg-[#50e2c3]/10 rounded transition-colors"
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
              Rate: 1 LHYPE = {lhypeData?.exchangeRate.toFixed(4) || '—'} HYPE
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
            <input
              type="text"
              value={estimatedLHYPE > 0 ? estimatedLHYPE.toFixed(6) : ''}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-medium text-white placeholder-zinc-600 outline-none"
            />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#50e2c3]/10 border border-[#50e2c3]/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-[#50e2c3]" />
              <span className="font-medium text-[#50e2c3]">LHYPE</span>
            </div>
          </div>
        </div>

        {isSuccess ? (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 font-medium">Deposit successful!</span>
            <a
              href={`https://purrsec.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-green-400 hover:text-green-300"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
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
          disabled={!amount || parsedAmount <= 0 || isPending || isConfirming || loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#50e2c3] to-[#3fcbac] text-black font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending || isConfirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isPending ? 'Confirm in Wallet...' : 'Processing...'}
            </>
          ) : (
            'Deposit HYPE'
          )}
        </button>

        <a
          href="https://app.loopingcollective.org/product/lhype"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Learn more about Looped HYPE
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
