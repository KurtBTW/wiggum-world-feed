import { createPublicClient, http, parseEther, formatEther, getAddress, encodeFunctionData, decodeFunctionResult } from 'viem';

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

async function test() {
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  const depositAmount = parseEther('1');
  
  const calldata = encodeFunctionData({
    abi: LHYPE_DEPOSITOR_ABI,
    functionName: 'depositNative',
    args: [depositAmount, BigInt(0), testAddress, '0x'],
  });
  
  console.log('Testing with eth_call (no balance check)...\n');
  
  try {
    const result = await client.call({
      to: DEPOSITOR,
      data: calldata,
      value: depositAmount,
      account: testAddress,
    });
    
    console.log('Raw result:', result.data);
    
    const decoded = decodeFunctionResult({
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative', 
      data: result.data,
    });
    
    console.log('Decoded shares:', formatEther(decoded), 'LHYPE');
    console.log('\nSUCCESS! The contract call works correctly.');
  } catch (e) {
    console.log('FAILED:', e.shortMessage || e.message);
    console.log('\nFull error:', e);
  }
}

test();
