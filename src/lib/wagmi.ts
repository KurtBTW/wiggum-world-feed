import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { hyperEVM } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'placeholder-for-build';

export const config = getDefaultConfig({
  appName: 'Last Network',
  projectId,
  chains: [hyperEVM],
  transports: {
    [hyperEVM.id]: http('https://rpc.hyperliquid.xyz/evm'),
  },
  ssr: true,
});
