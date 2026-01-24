import { type Chain } from '@rainbow-me/rainbowkit';

export const hyperEVM = {
  id: 999,
  name: 'HyperEVM',
  iconUrl: '/hyperliquid-icon.png',
  iconBackground: '#0a0a0a',
  nativeCurrency: {
    name: 'HYPE',
    symbol: 'HYPE',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
    public: {
      http: ['https://rpc.hyperliquid.xyz/evm'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Purrsec',
      url: 'https://purrsec.com',
    },
  },
} as const satisfies Chain;
