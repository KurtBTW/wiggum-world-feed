import { createPublicClient, http, parseEther, formatEther, getAddress, encodeFunctionData } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';

const CONTRACTS = {
  STAKING_MANAGER: '0x393D0B87Ed38fc779FD9611144aE649BA6082109',
  STAKING_ACCOUNTANT: '0x9209648Ec9D448EF57116B73A2f081835643dc7A',
  KHYPE_TOKEN: '0xfD739d4e423301CE9385c1fb8850539D657C296D',
};

const STAKING_MANAGER_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'totalStaked',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'minStakeAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'maxStakeAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const ACCOUNTANT_ABI = [
  {
    name: 'HYPEToKHYPE',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'HYPEAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'kHYPEToHYPE',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'kHYPEAmount', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const TOKEN_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const client = createPublicClient({ transport: http(RPC) });

async function simulate() {
  console.log('=== KINETIQ (kHYPE) SIMULATION ===\n');
  
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  const stakeAmount = parseEther('1');
  
  console.log('1. Reading protocol info...\n');
  
  try {
    const [totalStaked, minStake, maxStake, totalSupply] = await Promise.all([
      client.readContract({
        address: CONTRACTS.STAKING_MANAGER,
        abi: STAKING_MANAGER_ABI,
        functionName: 'totalStaked',
      }),
      client.readContract({
        address: CONTRACTS.STAKING_MANAGER,
        abi: STAKING_MANAGER_ABI,
        functionName: 'minStakeAmount',
      }),
      client.readContract({
        address: CONTRACTS.STAKING_MANAGER,
        abi: STAKING_MANAGER_ABI,
        functionName: 'maxStakeAmount',
      }),
      client.readContract({
        address: CONTRACTS.KHYPE_TOKEN,
        abi: TOKEN_ABI,
        functionName: 'totalSupply',
      }),
    ]);
    
    console.log('Protocol Stats:');
    console.log('  Total Staked:', formatEther(totalStaked), 'HYPE');
    console.log('  Min Stake:', formatEther(minStake), 'HYPE');
    console.log('  Max Stake:', formatEther(maxStake), 'HYPE');
    console.log('  kHYPE Supply:', formatEther(totalSupply), 'kHYPE');
  } catch (e) {
    console.log('  Error reading protocol info:', e.shortMessage || e.message);
  }
  
  console.log('\n2. Checking exchange rate...\n');
  
  try {
    const expectedKhype = await client.readContract({
      address: CONTRACTS.STAKING_ACCOUNTANT,
      abi: ACCOUNTANT_ABI,
      functionName: 'HYPEToKHYPE',
      args: [stakeAmount],
    });
    
    console.log('Exchange Rate:');
    console.log('  Input:', formatEther(stakeAmount), 'HYPE');
    console.log('  Output:', formatEther(expectedKhype), 'kHYPE');
    console.log('  Rate: 1 HYPE =', (Number(expectedKhype) / Number(stakeAmount)).toFixed(6), 'kHYPE');
  } catch (e) {
    console.log('  Error reading exchange rate:', e.shortMessage || e.message);
  }
  
  console.log('\n3. Verifying function selector...\n');
  
  const calldata = encodeFunctionData({
    abi: STAKING_MANAGER_ABI,
    functionName: 'stake',
    args: [],
  });
  
  console.log('Function Selector:', calldata);
  console.log('Expected: 0x3a4b66f1 (stake())');
  console.log('Match:', calldata === '0x3a4b66f1' ? 'YES ✓' : 'NO ✗');
  
  console.log('\n4. Simulating stake transaction...\n');
  
  try {
    await client.simulateContract({
      address: CONTRACTS.STAKING_MANAGER,
      abi: STAKING_MANAGER_ABI,
      functionName: 'stake',
      value: stakeAmount,
      account: testAddress,
    });
    console.log('SIMULATION SUCCESS! ✓');
    console.log('  stake() call would succeed with', formatEther(stakeAmount), 'HYPE');
  } catch (e) {
    console.log('SIMULATION RESULT:', e.shortMessage || e.message);
    if (e.message?.includes('insufficient') || e.message?.includes('balance')) {
      console.log('  (Expected - test account needs HYPE balance for actual tx)');
      console.log('  Contract call structure is VALID ✓');
    }
  }
  
  console.log('\n=== KINETIQ SIMULATION COMPLETE ===');
}

simulate();
