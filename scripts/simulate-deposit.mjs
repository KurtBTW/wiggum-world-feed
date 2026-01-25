import { createPublicClient, http, parseEther, getAddress } from 'viem';

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

// Checksum the address
const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
const depositAmount = parseEther('0.01');
const minShares = parseEther('0.0098');
const communityCode = '0x';

async function simulate() {
  try {
    console.log('Simulating depositNative with CORRECT ABI (bytes)...');
    console.log('Args:', { 
      depositAmount: depositAmount.toString(), 
      minShares: minShares.toString(), 
      to: testAddress, 
      communityCode 
    });
    
    const result = await client.simulateContract({
      address: DEPOSITOR,
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative',
      args: [depositAmount, minShares, testAddress, communityCode],
      value: depositAmount,
      account: testAddress,
    });
    
    console.log('SUCCESS! Shares returned:', result.result.toString());
  } catch (error) {
    console.log('SIMULATION FAILED:');
    console.log('Error:', error.shortMessage || error.message);
    if (error.cause?.reason) console.log('Reason:', error.cause.reason);
  }
}

simulate();
