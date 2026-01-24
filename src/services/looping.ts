const LHYPE_API = 'https://app.loopingcollective.org/api/external/asset/lhype';

export interface LHYPEData {
  rewardRate: number;
  apy: number;
  tvl: number;
  tvlUsd: number;
  exchangeRate: number;
  price: number;
}

export async function fetchLHYPEData(): Promise<LHYPEData> {
  const res = await fetch(LHYPE_API, { cache: 'no-store' });
  
  if (!res.ok) {
    throw new Error('Failed to fetch LHYPE data');
  }
  
  const json = await res.json();
  const data = json.result || json;
  
  return {
    rewardRate: data.reward_rate || 0,
    apy: (data.reward_rate || 0) * 100,
    tvl: data.assets_under_management || 0,
    tvlUsd: data.assets_under_management || 0,
    exchangeRate: data.exchange_ratio || 1,
    price: data.price || 0,
  };
}

export const LOOPING_CONTRACTS = {
  LHYPE: '0x5748ae796AE46A4F1348a1693de4b50560485562' as const,
  DEPOSITOR: '0x6e358dd1204c3fb1D24e569DF0899f48faBE5337' as const,
  ACCOUNTANT: '0xcE621a3CA6F72706678cFF0572ae8d15e5F001c3' as const,
  ATOMIC_QUEUE: '0x228C44Bb4885C6633F4b6C83f14622f37D5112E5' as const,
  WHYPE: '0x5555555555555555555555555555555555555555' as const,
  STHYPE: '0xfFaa4a3D97fE9107Cef8a3F48c069F577Ff76cC1' as const,
};
