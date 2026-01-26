import { createPublicClient, http, parseUnits, formatUnits, formatEther, getAddress, encodeFunctionData } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';

const CONTRACTS = {
  xHYPE: {
    SHARE_MANAGER: '0xac962fa04bf91b7fd0dc0c5c32414e0ce3c51e03',
    DEPOSIT_PIPE_USDC: '0xE7E0B7D87c4869549a4a47A8F216e362D0efc9F9',
    DEPOSIT_PIPE_USDT0: '0xe2d9598D5FeDb9E4044D50510AabA68B095f2Ab2',
    NAV_ORACLE: '0xbF97a22B1229B3FfbA65003C01df8bA9e7bfF042',
  },
  xBTC: {
    SHARE_MANAGER: '0x97df58CE4489896F4eC7D16B59B64aD0a56243a8',
    DEPOSIT_PIPE_USDC: '0x629010d62E54cfA49D6ac35e4e3DE2240d4cE4BF',
    DEPOSIT_PIPE_USDT0: '0x86826DfC171f1e0C6b6128CA05325B8cD9EcB68D',
    NAV_ORACLE: '0x2A6448fc3A0FAde5811bb0087836a090EaA34715',
  },
  STABLECOINS: {
    USDC: '0xb88339CB7199b77E23DB6E890353E22632Ba630f',
    USDT0: '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb',
  },
};

const DEPOSIT_PIPE_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'previewDeposit',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'assets', type: 'uint256' }],
    outputs: [{ name: 'shares', type: 'uint256' }],
  },
  {
    name: 'asset',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
];

const NAV_ORACLE_ABI = [
  {
    name: 'getNAV',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const SHARE_MANAGER_ABI = [
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
];

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
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
];

const client = createPublicClient({ transport: http(RPC) });

async function simulateVault(vaultName, contracts) {
  console.log(`\n--- ${vaultName} Vault ---\n`);
  
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  const depositAmount = parseUnits('100', 6); // 100 USDC/USDT0
  
  console.log('1. Reading vault info...');
  
  try {
    const [nav, totalSupply] = await Promise.all([
      client.readContract({
        address: contracts.NAV_ORACLE,
        abi: NAV_ORACLE_ABI,
        functionName: 'getNAV',
      }),
      client.readContract({
        address: contracts.SHARE_MANAGER,
        abi: SHARE_MANAGER_ABI,
        functionName: 'totalSupply',
      }),
    ]);
    
    const sharePrice = totalSupply > 0n ? Number(nav) / Number(totalSupply) : 1;
    
    console.log('  NAV:', formatEther(nav), 'USD (18 decimals)');
    console.log('  Total Supply:', formatEther(totalSupply), 'shares');
    console.log('  Share Price:', sharePrice.toFixed(6), 'USD');
  } catch (e) {
    console.log('  Error reading vault info:', e.shortMessage || e.message);
  }
  
  console.log('\n2. Checking DepositPipe (USDC)...');
  
  try {
    const assetAddress = await client.readContract({
      address: contracts.DEPOSIT_PIPE_USDC,
      abi: DEPOSIT_PIPE_ABI,
      functionName: 'asset',
    });
    
    console.log('  Asset address:', assetAddress);
    console.log('  Expected USDC:', CONTRACTS.STABLECOINS.USDC);
    console.log('  Match:', assetAddress.toLowerCase() === CONTRACTS.STABLECOINS.USDC.toLowerCase() ? 'YES ✓' : 'NO ✗');
  } catch (e) {
    console.log('  Error:', e.shortMessage || e.message);
  }
  
  console.log('\n3. Preview deposit (100 USDC)...');
  
  try {
    const previewShares = await client.readContract({
      address: contracts.DEPOSIT_PIPE_USDC,
      abi: DEPOSIT_PIPE_ABI,
      functionName: 'previewDeposit',
      args: [depositAmount],
    });
    
    console.log('  Input: 100 USDC');
    console.log('  Output:', formatEther(previewShares), vaultName, 'shares');
  } catch (e) {
    console.log('  Error:', e.shortMessage || e.message);
  }
  
  console.log('\n4. Verifying function selector...');
  
  const calldata = encodeFunctionData({
    abi: DEPOSIT_PIPE_ABI,
    functionName: 'deposit',
    args: [depositAmount, testAddress],
  });
  
  const selector = calldata.slice(0, 10);
  console.log('  Function Selector:', selector);
  console.log('  Expected: 0x6e553f65 (deposit(uint256,address))');
  console.log('  Match:', selector === '0x6e553f65' ? 'YES ✓' : 'NO ✗');
  
  console.log('\n5. Simulating deposit transaction...');
  
  try {
    await client.simulateContract({
      address: contracts.DEPOSIT_PIPE_USDC,
      abi: DEPOSIT_PIPE_ABI,
      functionName: 'deposit',
      args: [depositAmount, testAddress],
      account: testAddress,
    });
    console.log('  SIMULATION SUCCESS! ✓');
  } catch (e) {
    const msg = e.shortMessage || e.message;
    console.log('  SIMULATION RESULT:', msg);
    if (msg.includes('allowance') || msg.includes('transfer') || msg.includes('insufficient')) {
      console.log('  (Expected - requires ERC20 approval and balance)');
      console.log('  Contract call structure is VALID ✓');
    }
  }
}

async function simulate() {
  console.log('=== LIMINAL (xHYPE / xBTC) SIMULATION ===');
  
  console.log('\n1. Verifying stablecoin contracts...\n');
  
  for (const [name, address] of Object.entries(CONTRACTS.STABLECOINS)) {
    try {
      const [symbol, decimals] = await Promise.all([
        client.readContract({ address, abi: ERC20_ABI, functionName: 'symbol' }),
        client.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
      ]);
      console.log(`  ${name}: ${symbol} (${decimals} decimals) at ${address} ✓`);
    } catch (e) {
      console.log(`  ${name}: Error - ${e.shortMessage || e.message}`);
    }
  }
  
  await simulateVault('xHYPE', CONTRACTS.xHYPE);
  await simulateVault('xBTC', CONTRACTS.xBTC);
  
  console.log('\n=== LIMINAL SIMULATION COMPLETE ===\n');
}

simulate();
