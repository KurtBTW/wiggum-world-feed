'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { LOOPING_CONTRACTS } from '@/services/looping';
import { KINETIQ_CONTRACTS } from '@/services/kinetiq';
import { LIMINAL_CONTRACTS } from '@/services/liminal';
import { 
  LHYPE_DEPOSITOR_ABI, 
  KINETIQ_STAKING_MANAGER_ABI, 
  LIMINAL_DEPOSIT_PIPE_ABI,
  ERC20_ABI 
} from '@/lib/abis';

const KINETIQ_MIN_STAKE = 1;

export type VaultType = 'lhype' | 'khype' | 'xhype' | 'xbtc';

export interface DepositRequest {
  vault: VaultType;
  amount: string;
  stablecoin?: 'USDC' | 'USDT0';
}

export interface DepositState {
  status: 'idle' | 'confirming' | 'pending' | 'success' | 'error';
  txHash?: string;
  error?: string;
}

interface ChatDepositContextType {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  hypeBalance: string;
  usdcBalance: string;
  usdt0Balance: string;
  depositState: DepositState;
  executeDeposit: (request: DepositRequest) => Promise<void>;
  resetDepositState: () => void;
  getVaultInfo: (vault: VaultType) => { name: string; token: string; apy: string; depositAsset: string };
}

const ChatDepositContext = createContext<ChatDepositContextType | null>(null);

export function ChatDepositProvider({ children }: { children: ReactNode }) {
  const { address, isConnected } = useAccount();
  const [depositState, setDepositState] = useState<DepositState>({ status: 'idle' });
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  const { data: hypeBalanceData } = useBalance({ address });
  const { data: usdcBalanceData } = useReadContract({
    address: LIMINAL_CONTRACTS.STABLECOINS.USDC,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
  const { data: usdt0BalanceData } = useReadContract({
    address: LIMINAL_CONTRACTS.STABLECOINS.USDT0,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContractAsync } = useWriteContract();
  const { isSuccess: txSuccess, isError: txError } = useWaitForTransactionReceipt({ hash: pendingTxHash });

  if (txSuccess && depositState.status === 'pending') {
    setDepositState({ status: 'success', txHash: pendingTxHash });
  }
  if (txError && depositState.status === 'pending') {
    setDepositState({ status: 'error', txHash: pendingTxHash, error: 'Transaction failed' });
  }

  const hypeBalance = hypeBalanceData ? formatEther(hypeBalanceData.value) : '0';
  const usdcBalance = usdcBalanceData ? formatUnits(usdcBalanceData as bigint, 6) : '0';
  const usdt0Balance = usdt0BalanceData ? formatUnits(usdt0BalanceData as bigint, 6) : '0';

  const getVaultInfo = useCallback((vault: VaultType) => {
    switch (vault) {
      case 'lhype':
        return { name: 'Looping Collective', token: 'LHYPE', apy: 'Variable', depositAsset: 'HYPE' };
      case 'khype':
        return { name: 'Kinetiq', token: 'kHYPE', apy: 'Variable', depositAsset: 'HYPE' };
      case 'xhype':
        return { name: 'Liminal xHYPE', token: 'xHYPE', apy: 'Variable', depositAsset: 'USDC/USDT0' };
      case 'xbtc':
        return { name: 'Liminal xBTC', token: 'xBTC', apy: 'Variable', depositAsset: 'USDC/USDT0' };
    }
  }, []);

  const executeDeposit = useCallback(async (request: DepositRequest) => {
    if (!address) {
      setDepositState({ status: 'error', error: 'Wallet not connected' });
      return;
    }

    setDepositState({ status: 'confirming' });

    try {
      let txHash: `0x${string}`;

      switch (request.vault) {
        case 'lhype': {
          const depositAmount = parseEther(request.amount);
          txHash = await writeContractAsync({
            address: LOOPING_CONTRACTS.DEPOSITOR,
            abi: LHYPE_DEPOSITOR_ABI,
            functionName: 'depositNative',
            args: [depositAmount, BigInt(0), address, '0x'],
            value: depositAmount,
          });
          break;
        }
        case 'khype': {
          const stakeAmount = parseEther(request.amount);
          const stakeAmountNum = parseFloat(request.amount);
          if (stakeAmountNum < KINETIQ_MIN_STAKE) {
            throw new Error(`Minimum stake is ${KINETIQ_MIN_STAKE} HYPE`);
          }
          txHash = await writeContractAsync({
            address: KINETIQ_CONTRACTS.STAKING_MANAGER,
            abi: KINETIQ_STAKING_MANAGER_ABI,
            functionName: 'stake',
            value: stakeAmount,
          });
          break;
        }
        case 'xhype':
        case 'xbtc': {
          const stablecoin = request.stablecoin || 'USDC';
          const depositAmount = parseUnits(request.amount, 6);
          const contracts = request.vault === 'xhype' ? LIMINAL_CONTRACTS.xHYPE : LIMINAL_CONTRACTS.xBTC;
          const depositPipe = stablecoin === 'USDC' ? contracts.DEPOSIT_PIPE_USDC : contracts.DEPOSIT_PIPE_USDT0;
          const tokenAddress = stablecoin === 'USDC' ? LIMINAL_CONTRACTS.STABLECOINS.USDC : LIMINAL_CONTRACTS.STABLECOINS.USDT0;

          await writeContractAsync({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [depositPipe, depositAmount],
          });

          txHash = await writeContractAsync({
            address: depositPipe,
            abi: LIMINAL_DEPOSIT_PIPE_ABI,
            functionName: 'deposit',
            args: [depositAmount, address],
          });
          break;
        }
        default:
          throw new Error('Unknown vault type');
      }

      setPendingTxHash(txHash);
      setDepositState({ status: 'pending', txHash });
    } catch (error: any) {
      const errorMessage = error?.shortMessage || error?.message || 'Transaction failed';
      setDepositState({ status: 'error', error: errorMessage });
    }
  }, [address, writeContractAsync]);

  const resetDepositState = useCallback(() => {
    setDepositState({ status: 'idle' });
    setPendingTxHash(undefined);
  }, []);

  return (
    <ChatDepositContext.Provider
      value={{
        address,
        isConnected,
        hypeBalance,
        usdcBalance,
        usdt0Balance,
        depositState,
        executeDeposit,
        resetDepositState,
        getVaultInfo,
      }}
    >
      {children}
    </ChatDepositContext.Provider>
  );
}

const DEFAULT_CONTEXT: ChatDepositContextType = {
  address: undefined,
  isConnected: false,
  hypeBalance: '0',
  usdcBalance: '0',
  usdt0Balance: '0',
  depositState: { status: 'idle' },
  executeDeposit: async () => {},
  resetDepositState: () => {},
  getVaultInfo: (vault: VaultType) => {
    switch (vault) {
      case 'lhype':
        return { name: 'Looping Collective', token: 'LHYPE', apy: 'Variable', depositAsset: 'HYPE' };
      case 'khype':
        return { name: 'Kinetiq', token: 'kHYPE', apy: 'Variable', depositAsset: 'HYPE' };
      case 'xhype':
        return { name: 'Liminal xHYPE', token: 'xHYPE', apy: 'Variable', depositAsset: 'USDC/USDT0' };
      case 'xbtc':
        return { name: 'Liminal xBTC', token: 'xBTC', apy: 'Variable', depositAsset: 'USDC/USDT0' };
    }
  },
};

export function useChatDeposit() {
  const context = useContext(ChatDepositContext);
  return context || DEFAULT_CONTEXT;
}
