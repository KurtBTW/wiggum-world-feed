import { createPublicClient, http, decodeFunctionData, formatEther } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const client = createPublicClient({ transport: http(RPC) });

const LHYPE_DEPOSITOR_ABI = [
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
];

// Check a successful deposit native tx
const txHash = '0x73a6dcd77c629be5de1eead1c73c868b3ef239ad2d0ad188f29c08d7d47864bd';

async function check() {
  const tx = await client.getTransaction({ hash: txHash });
  console.log('TX:', txHash);
  console.log('Value (HYPE sent):', formatEther(tx.value));
  console.log('Input data:', tx.input);
  
  try {
    const decoded = decodeFunctionData({
      abi: LHYPE_DEPOSITOR_ABI,
      data: tx.input,
    });
    console.log('\nDecoded args:');
    console.log('  depositAmount:', formatEther(decoded.args[0]), 'HYPE');
    console.log('  minimumMint:', formatEther(decoded.args[1]), 'LHYPE');
    console.log('  to:', decoded.args[2]);
    console.log('  communityCode:', decoded.args[3]);
  } catch (e) {
    console.log('Decode error:', e.message);
  }
}

check();
