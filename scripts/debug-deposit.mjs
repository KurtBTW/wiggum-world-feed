import { createPublicClient, http, parseEther, formatEther, getAddress } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const LHYPE_API = 'https://app.loopingcollective.org/api/external/asset/lhype';
const DEPOSITOR = '0x6e358dd1204c3fb1D24e569DF0899f48faBE5337';
const ACCOUNTANT = '0xcE621a3CA6F72706678cFF0572ae8d15e5F001c3';
const WHYPE = '0x5555555555555555555555555555555555555555';

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

const ACCOUNTANT_ABI = [
  {
    name: 'getRateInQuote',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'quote', type: 'address' }],
    outputs: [{ name: 'rate', type: 'uint256' }],
  },
];

const client = createPublicClient({ transport: http(RPC) });

async function debug() {
  console.log('=== DEBUGGING LHYPE DEPOSIT ===\n');
  
  // 1. Fetch API data (like the component does)
  console.log('1. Fetching API data...');
  const apiRes = await fetch(LHYPE_API);
  const apiData = await apiRes.json();
  console.log('   Raw API response:', JSON.stringify(apiData, null, 2));
  
  const exchangeRateFromAPI = apiData.result?.exchange_ratio || apiData.exchange_ratio || 1;
  console.log('   Exchange rate from API:', exchangeRateFromAPI);
  
  // 2. Fetch on-chain rate from Accountant
  console.log('\n2. Fetching on-chain rate from Accountant...');
  const onChainRate = await client.readContract({
    address: ACCOUNTANT,
    abi: ACCOUNTANT_ABI,
    functionName: 'getRateInQuote',
    args: [WHYPE],
  });
  const onChainRateFormatted = Number(formatEther(onChainRate));
  console.log('   On-chain rate (raw):', onChainRate.toString());
  console.log('   On-chain rate (formatted):', onChainRateFormatted);
  
  // 3. Simulate what the component does
  console.log('\n3. Simulating component logic...');
  const testAmount = '1'; // 1 HYPE
  const parsedAmount = parseFloat(testAmount);
  const depositAmount = parseEther(testAmount);
  
  // Component's calculation
  const estimatedLHYPE = parsedAmount / exchangeRateFromAPI;
  const slippage = 0.005;
  const minSharesFromComponent = parseEther((estimatedLHYPE * (1 - slippage)).toFixed(18));
  
  console.log('   Deposit amount:', testAmount, 'HYPE');
  console.log('   Estimated LHYPE (from API rate):', estimatedLHYPE);
  console.log('   Min shares (with 0.5% slippage):', formatEther(minSharesFromComponent));
  
  // What the contract would actually give
  const actualShares = BigInt(depositAmount) * BigInt(10n**18n) / onChainRate;
  console.log('   Actual shares (from on-chain rate):', formatEther(actualShares));
  
  // Check if minShares is too high
  const wouldRevert = minSharesFromComponent > actualShares;
  console.log('\n   WOULD REVERT (minShares > actualShares)?', wouldRevert ? 'YES!!!' : 'No');
  
  if (wouldRevert) {
    console.log('   PROBLEM: API rate is stale/different from on-chain rate!');
    console.log('   API thinks 1 HYPE = ', 1/exchangeRateFromAPI, 'LHYPE');
    console.log('   Chain says 1 HYPE = ', formatEther(actualShares), 'LHYPE');
  }
  
  // 4. Simulate with on-chain rate instead
  console.log('\n4. Simulating with ON-CHAIN rate...');
  const safeMinShares = (actualShares * 995n) / 1000n; // 0.5% slippage from actual
  console.log('   Safe min shares:', formatEther(safeMinShares));
  
  const testAddress = getAddress('0xe606187b439d12d0a122cdbbb51c2575a56a01bc');
  
  try {
    const result = await client.simulateContract({
      address: DEPOSITOR,
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative',
      args: [depositAmount, safeMinShares, testAddress, '0x'],
      value: depositAmount,
      account: testAddress,
    });
    console.log('   SIMULATION SUCCESS! Shares:', formatEther(result.result));
  } catch (e) {
    console.log('   SIMULATION FAILED:', e.shortMessage || e.message);
  }
  
  // 5. Try with component's minShares
  console.log('\n5. Simulating with COMPONENT minShares (from API rate)...');
  try {
    const result = await client.simulateContract({
      address: DEPOSITOR,
      abi: LHYPE_DEPOSITOR_ABI,
      functionName: 'depositNative',
      args: [depositAmount, minSharesFromComponent, testAddress, '0x'],
      value: depositAmount,
      account: testAddress,
    });
    console.log('   SIMULATION SUCCESS! Shares:', formatEther(result.result));
  } catch (e) {
    console.log('   SIMULATION FAILED:', e.shortMessage || e.message);
  }
  
  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

debug().catch(console.error);
