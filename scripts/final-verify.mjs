import { createPublicClient, http, parseEther, formatEther, getAddress, encodeFunctionData } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const DEPOSITOR = '0x6e358dd1204c3fb1D24e569DF0899f48faBE5337';

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

const client = createPublicClient({ transport: http(RPC) });

async function verify() {
  console.log('=== FINAL VERIFICATION ===\n');
  
  // Use a real address with balance for simulation
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  const depositAmount = parseEther('1');
  const minMint = BigInt(0); // Set to 0 like the new component does
  
  console.log('Parameters (matching new component):');
  console.log('  depositAmount:', formatEther(depositAmount), 'HYPE');
  console.log('  minimumMint:', minMint.toString(), '(0 = no slippage check)');
  console.log('  to:', testAddress);
  console.log('  communityCode: 0x (empty bytes)');
  
  // Encode calldata
  const calldata = encodeFunctionData({
    abi: LHYPE_DEPOSITOR_ABI,
    functionName: 'depositNative',
    args: [depositAmount, minMint, testAddress, '0x'],
  });
  
  console.log('\nCalldata:', calldata.slice(0, 10) + '...');
  console.log('Function selector:', calldata.slice(0, 10));
  console.log('Expected: 0x771c4fbf -', calldata.slice(0, 10) === '0x771c4fbf' ? 'MATCH ✓' : 'MISMATCH ✗');
  
  // Simulate
  console.log('\n--- Simulating contract call ---');
  try {
    const result = await client.simulateContract({
      address: DEPOSITOR,
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative',
      args: [depositAmount, minMint, testAddress, '0x'],
      value: depositAmount,
      account: testAddress,
    });
    console.log('SIMULATION SUCCESS!');
    console.log('Shares to receive:', formatEther(result.result), 'LHYPE');
  } catch (e) {
    console.log('SIMULATION FAILED:', e.shortMessage || e.message);
    if (e.message.includes('balance')) {
      console.log('(Expected - test account has no balance for actual tx)');
    }
  }
  
  console.log('\n=== VERIFICATION COMPLETE ===');
}

verify();
