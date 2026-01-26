'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSimulateContract, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { Loader2, ArrowDown, ExternalLink, TrendingUp, CheckCircle, AlertCircle, ChevronDown, Bitcoin } from 'lucide-react';
import { LIMINAL_CONTRACTS, fetchLiminalData, type LiminalData, type LiminalVault } from '@/services/liminal';
import { LIMINAL_DEPOSIT_PIPE_ABI, ERC20_ABI } from '@/lib/abis';

interface LiminalDepositProps {
  onSuccess?: () => void;
}

type StablecoinKey = 'USDC' | 'USDT0';

const STABLECOIN_DECIMALS = 6;

export function LiminalDeposit({ onSuccess }: LiminalDepositProps) {
  const { address, isConnected } = useAccount();
  
  const [amount, setAmount] = useState('');
  const [selectedVault, setSelectedVault] = useState<LiminalVault>('xHYPE');
  const [selectedStable, setSelectedStable] = useState<StablecoinKey>('USDC');
  const [liminalData, setLiminalData] = useState<Record<LiminalVault, LiminalData | null>>({ xHYPE: null, xBTC: null });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  
  const { data: depositHash, writeContract: writeDeposit, isPending: isDepositPending, error: depositError, reset: resetDeposit } = useWriteContract();
  const { data: approveHash, writeContract: writeApprove, isPending: isApprovePending, error: approveError, reset: resetApprove } = useWriteContract();
  
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const parsedAmount = amount ? parseFloat(amount) : 0;
  const depositAmount = parsedAmount > 0 ? parseUnits(amount, STABLECOIN_DECIMALS) : BigInt(0);
  
  const stablecoinAddress = LIMINAL_CONTRACTS.STABLECOINS[selectedStable];
  const depositPipeAddress = selectedVault === 'xHYPE' 
    ? (selectedStable === 'USDC' ? LIMINAL_CONTRACTS.xHYPE.DEPOSIT_PIPE_USDC : LIMINAL_CONTRACTS.xHYPE.DEPOSIT_PIPE_USDT0)
    : (selectedStable === 'USDC' ? LIMINAL_CONTRACTS.xBTC.DEPOSIT_PIPE_USDC : LIMINAL_CONTRACTS.xBTC.DEPOSIT_PIPE_USDT0);

  const { data: stableBalance } = useReadContract({
    address: stablecoinAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: stablecoinAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, depositPipeAddress] : undefined,
    query: { enabled: !!address },
  });

  const { data: previewShares } = useReadContract({
    address: depositPipeAddress,
    abi: LIMINAL_DEPOSIT_PIPE_ABI,
    functionName: 'previewDeposit',
    args: [depositAmount],
    query: { enabled: depositAmount > BigInt(0) },
  });

  useEffect(() => {
    Promise.all([
      fetchLiminalData('xHYPE'),
      fetchLiminalData('xBTC'),
    ])
      .then(([xhype, xbtc]) => setLiminalData({ xHYPE: xhype, xBTC: xbtc }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (allowance !== undefined && depositAmount > BigInt(0)) {
      setNeedsApproval(allowance < depositAmount);
    }
  }, [allowance, depositAmount]);

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      setNeedsApproval(false);
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isDepositSuccess && onSuccess) {
      onSuccess();
    }
  }, [isDepositSuccess, onSuccess]);

  const estimatedShares = previewShares 
    ? parseFloat(formatUnits(previewShares, 18))
    : 0;

  const { error: simulateError } = useSimulateContract({
    address: depositPipeAddress,
    abi: LIMINAL_DEPOSIT_PIPE_ABI,
    functionName: 'deposit',
    args: [depositAmount, address!],
    query: {
      enabled: !!address && depositAmount > BigInt(0) && !needsApproval,
    },
  });

  const handleApprove = async () => {
    if (!address) return;
    resetApprove();
    
    writeApprove({
      address: stablecoinAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [depositPipeAddress, depositAmount],
    });
  };

  const handleDeposit = async () => {
    if (!address || !amount || parsedAmount <= 0) return;
    resetDeposit();

    writeDeposit({
      address: depositPipeAddress,
      abi: LIMINAL_DEPOSIT_PIPE_ABI,
      functionName: 'deposit',
      args: [depositAmount, address],
    });
  };

  const handleMaxClick = () => {
    if (stableBalance) {
      const maxAmount = parseFloat(formatUnits(stableBalance, STABLECOIN_DECIMALS));
      setAmount(maxAmount.toFixed(2));
    }
  };

  const currentData = liminalData[selectedVault];
  const isPending = isDepositPending || isApprovePending;
  const isConfirming = isDepositConfirming || isApproveConfirming;
  const writeError = depositError || approveError;

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center">
            <Bitcoin className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white">Liminal Delta-Neutral</h3>
            <p className="text-xs text-zinc-500">xHYPE & xBTC vaults</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentData && (
            <div className="text-right">
              <p className="text-lg font-bold text-[#f59e0b]">{currentData.apy.toFixed(1)}% APY</p>
              <p className="text-xs text-zinc-500">Stablecoin deposits</p>
            </div>
          )}
          <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-white/[0.06]">
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => setSelectedVault('xHYPE')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedVault === 'xHYPE'
                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                  : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              xHYPE ({liminalData.xHYPE?.apy.toFixed(1) || '—'}%)
            </button>
            <button
              onClick={() => setSelectedVault('xBTC')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedVault === 'xBTC'
                  ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30'
                  : 'bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              xBTC ({liminalData.xBTC?.apy.toFixed(1) || '—'}%)
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStable('USDC')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                selectedStable === 'USDC'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              USDC
            </button>
            <button
              onClick={() => setSelectedStable('USDT0')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                selectedStable === 'USDT0'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-white/[0.03] text-zinc-500 border border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              USDT0
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">You deposit</span>
              <span className="text-zinc-500">
                Balance: {stableBalance ? parseFloat(formatUnits(stableBalance, STABLECOIN_DECIMALS)).toFixed(2) : '0'} {selectedStable}
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
                className="px-2 py-1 text-xs font-medium text-[#f59e0b] hover:bg-[#f59e0b]/10 rounded transition-colors"
              >
                MAX
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] rounded-lg">
                <span className="font-medium text-white">{selectedStable}</span>
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
              <span className="text-zinc-500">Shares (18 decimals)</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl">
              <input
                type="text"
                value={estimatedShares > 0 ? estimatedShares.toFixed(6) : ''}
                readOnly
                placeholder="0.00"
                className="flex-1 bg-transparent text-xl font-medium text-white placeholder-zinc-600 outline-none"
              />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-[#f59e0b]" />
                <span className="font-medium text-[#f59e0b]">{selectedVault}</span>
              </div>
            </div>
          </div>

          {isDepositSuccess ? (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400 font-medium">Deposit successful!</span>
              <a
                href={`https://purrsec.com/tx/${depositHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-green-400 hover:text-green-300"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : isApproveSuccess && needsApproval === false ? (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span className="text-blue-400 font-medium">Approved! Now deposit.</span>
            </div>
          ) : simulateError && !needsApproval ? (
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

          {needsApproval ? (
            <button
              onClick={handleApprove}
              disabled={!amount || parsedAmount <= 0 || isPending || isConfirming || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isApprovePending || isApproveConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isApprovePending ? 'Confirm Approval...' : 'Approving...'}
                </>
              ) : (
                `Approve ${selectedStable}`
              )}
            </button>
          ) : (
            <button
              onClick={handleDeposit}
              disabled={!amount || parsedAmount <= 0 || isPending || isConfirming || loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDepositPending || isDepositConfirming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isDepositPending ? 'Confirm in Wallet...' : 'Processing...'}
                </>
              ) : (
                `Deposit ${selectedStable}`
              )}
            </button>
          )}

          <a
            href="https://app.liminal.money"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Learn more about Liminal
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
