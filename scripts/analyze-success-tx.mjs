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
      { name: 'communityCode', type: 'bytes' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
];

// Recent successful small deposits
const txHashes = [
  '0x73a6dcd77c629be5de1eead1c73c868b3ef239ad2d0ad188f29c08d7d47864bd', // 40 HYPE
  '0x55995deff39efd91d72ab44f515a73e064db53c64dcd7bc48bec4a1b7cf20c8b', // 1.141 HYPE
  '0x4b39ca8fe60d429417b49244738639f3ef6a904ca0f3b5a35bdecf8b33574e9f', // 0.0035 HYPE
];

async function analyze() {
  console.log('=== ANALYZING SUCCESSFUL TRANSACTIONS ===\n');
  
  for (const hash of txHashes) {
    try {
      const tx = await client.getTransaction({ hash });
      const receipt = await client.getTransactionReceipt({ hash });
      
      console.log('TX:', hash.slice(0, 20) + '...');
      console.log('  Status:', receipt.status);
      console.log('  Value sent:', formatEther(tx.value), 'HYPE');
      console.log('  Gas used:', receipt.gasUsed.toString());
      
      const decoded = decodeFunctionData({
        abi: LHYPE_DEPOSITOR_ABI,
        data: tx.input,
      });
      
      const [depositAmt, minMint, to, code] = decoded.args;
      console.log('  Args:');
      console.log('    depositAmount:', formatEther(depositAmt));
      console.log('    minimumMint:', formatEther(minMint));
      console.log('    to:', to);
      console.log('    communityCode:', code);
      
      // Calculate the ratio
      const ratio = Number(depositAmt) / Number(minMint);
      console.log('    ratio (deposit/minMint):', ratio.toFixed(6));
      console.log('');
    } catch (e) {
      console.log('Error analyzing', hash, ':', e.message);
    }
  }
}

analyze();
