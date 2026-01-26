import { fetchVaultYield } from './yields';

export const LIMINAL_CONTRACTS = {
  xHYPE: {
    SHARE_MANAGER: '0xac962fa04bf91b7fd0dc0c5c32414e0ce3c51e03' as const,
    DEPOSIT_PIPE_USDC: '0xE7E0B7D87c4869549a4a47A8F216e362D0efc9F9' as const,
    DEPOSIT_PIPE_USDT0: '0xe2d9598D5FeDb9E4044D50510AabA68B095f2Ab2' as const,
    DEPOSIT_PIPE_USDH: '0xf64428046b62b6CE4750ab499B06b8a108E1E91c' as const,
    NAV_ORACLE: '0xbF97a22B1229B3FfbA65003C01df8bA9e7bfF042' as const,
  },
  xBTC: {
    SHARE_MANAGER: '0x97df58CE4489896F4eC7D16B59B64aD0a56243a8' as const,
    DEPOSIT_PIPE_USDC: '0x629010d62E54cfA49D6ac35e4e3DE2240d4cE4BF' as const,
    DEPOSIT_PIPE_USDT0: '0x86826DfC171f1e0C6b6128CA05325B8cD9EcB68D' as const,
    DEPOSIT_PIPE_USDH: '0x22e207014fD9F40fcAEEDeF1597b590cf824d05f' as const,
    NAV_ORACLE: '0x2A6448fc3A0FAde5811bb0087836a090EaA34715' as const,
  },
  STABLECOINS: {
    USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f' as const,
    USDT0: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb' as const,
    USDH: '0xFb28Fa5FD48CF4eB56aF3BC5a7670a653Ff78d7c' as const,
  },
};

export type LiminalVault = 'xHYPE' | 'xBTC';

export interface LiminalData {
  apy: number;
  tvl: number;
  tvlUsd: number;
  sharePrice: number;
}

export async function fetchLiminalData(vault: LiminalVault): Promise<LiminalData> {
  try {
    const vaultKey = vault === 'xHYPE' ? 'xhype' : 'xbtc';
    const yieldData = await fetchVaultYield(vaultKey);
    
    return {
      apy: yieldData.apy,
      tvl: yieldData.tvlUsd,
      tvlUsd: yieldData.tvlUsd,
      sharePrice: 1.0,
    };
  } catch (error) {
    console.error(`[Liminal] Failed to fetch ${vault} yield data:`, error);
    const fallbackApy = vault === 'xHYPE' ? 4.5 : 4.0;
    const fallbackTvl = vault === 'xHYPE' ? 3_800_000 : 0;
    
    return {
      apy: fallbackApy,
      tvl: fallbackTvl,
      tvlUsd: fallbackTvl,
      sharePrice: 1.0,
    };
  }
}
