import { fetchVaultYield } from './yields';

export const KINETIQ_CONTRACTS = {
  KHYPE: '0xfD739d4e423301CE9385c1fb8850539D657C296D' as const,
  STAKING_MANAGER: '0x393D0B87Ed38fc779FD9611144aE649BA6082109' as const,
  STAKING_ACCOUNTANT: '0x9209648Ec9D448EF57116B73A2f081835643dc7A' as const,
  VALIDATOR_MANAGER: '0x4b797A93DfC3D18Cf98B7322a2b142FA8007508f' as const,
};

export interface KinetiqData {
  apy: number;
  tvl: number;
  tvlUsd: number;
  exchangeRate: number;
}

export async function fetchKinetiqData(): Promise<KinetiqData> {
  try {
    const yieldData = await fetchVaultYield('khype');
    
    return {
      apy: yieldData.apy,
      tvl: yieldData.tvlUsd,
      tvlUsd: yieldData.tvlUsd,
      exchangeRate: 1.0,
    };
  } catch (error) {
    console.error('[Kinetiq] Failed to fetch yield data:', error);
    return {
      apy: 4.0,
      tvl: 0,
      tvlUsd: 0,
      exchangeRate: 1.0,
    };
  }
}
