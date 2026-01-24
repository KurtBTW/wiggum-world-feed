export const LHYPE_DEPOSITOR_ABI = [
  {
    name: 'depositNative',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'depositAmount', type: 'uint256' },
      { name: 'minimumMint', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'communityCode', type: 'bytes32' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'depositAsset', type: 'address' },
      { name: 'depositAmount', type: 'uint256' },
      { name: 'minimumMint', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'communityCode', type: 'bytes32' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
] as const;

export const LHYPE_TOKEN_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const LHYPE_ACCOUNTANT_ABI = [
  {
    name: 'getRateInQuote',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'quote', type: 'address' }],
    outputs: [{ name: 'rate', type: 'uint256' }],
  },
  {
    name: 'getRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: 'rate', type: 'uint256' }],
  },
] as const;
