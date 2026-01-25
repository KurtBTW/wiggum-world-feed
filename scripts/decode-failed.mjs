import { createPublicClient, http, decodeFunctionData, formatEther } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const client = createPublicClient({ transport: http(RPC) });

// Wrong ABI (what your transactions are using)
const WRONG_ABI = [
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

// Correct ABI
const CORRECT_ABI = [
  {
    name: 'depositNative',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'depositAmount', type: 'uint256' },
      { name: 'minimumMint', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'communityCode', type: 'bytes' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
];

// Your recent failed transactions
const failedTxs = [
  '0x1e13bad0587a833e9f6d0a85c0f0dacd0d65ed6483f3d768b5354057922dd77e',
  '0x71b7b28b8ee9c05495dabbaebba0ef3c1b9f27374238263a188af5d7008b83e7',
  '0xad39e9260593591df9cb2c8d560dbf9633c34b3667e29692a8dce761aef83193',
];

async function decode() {
  console.log('=== ANALYZING YOUR FAILED TRANSACTIONS ===\n');
  console.log('WRONG selector (bytes32): 0x2a2c63d9');
  console.log('CORRECT selector (bytes): 0x771c4fbf\n');
  
  for (const hash of failedTxs) {
    try {
      const tx = await client.getTransaction({ hash });
      const receipt = await client.getTransactionReceipt({ hash });
      
      console.log('TX:', hash.slice(0, 20) + '...');
      console.log('  Status:', receipt.status === 'success' ? 'SUCCESS' : 'FAILED');
      console.log('  Function selector used:', tx.input.slice(0, 10));
      console.log('  Is WRONG selector?', tx.input.slice(0, 10) === '0x2a2c63d9' ? 'YES - THIS IS WHY IT FAILED' : 'No');
      console.log('');
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
  
  console.log('=== DIAGNOSIS ===');
  console.log('Your transactions are using the OLD/WRONG function selector.');
  console.log('This means Vercel has NOT deployed the fix yet, or you need to hard refresh.');
}

decode();
