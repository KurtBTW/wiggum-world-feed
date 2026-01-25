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
  // Test account has ~0.39 HYPE, test with 0.1
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  const depositAmount = parseEther('0.1');
  
  const calldata = encodeFunctionData({
    abi: LHYPE_DEPOSITOR_ABI,
    functionName: 'depositNative',
    args: [depositAmount, BigInt(0), testAddress, '0x'],
  });
  
  console.log('Testing with 0.1 HYPE (test account has ~0.39)...\n');
  console.log('Calldata:', calldata.slice(0, 10) + '...');
  console.log('Selector check:', calldata.slice(0, 10) === '0x771c4fbf' ? 'CORRECT ✓' : 'WRONG ✗');
  
  try {
    const result = await client.call({
      to: DEPOSITOR,
      data: calldata,
      value: depositAmount,
      account: testAddress,
    });
    
    const decoded = decodeFunctionResult({
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative', 
      data: result.data,
    });
    
    console.log('\nSUCCESS!');
    console.log('Deposit:', formatEther(depositAmount), 'HYPE');
    console.log('Receive:', formatEther(decoded), 'LHYPE');
    console.log('\nThe contract call is working correctly.');
    console.log('The component should work with the new code.');
  } catch (e) {
    console.log('\nFAILED:', e.shortMessage || e.message);
  }
}

test();
