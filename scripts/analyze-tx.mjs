import { createPublicClient, http, formatEther, decodeErrorResult } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const client = createPublicClient({ transport: http(RPC) });

const TX_HASH = '0x1e13bad0587a833e9f6d0a85c0f0dacd0d65ed6483f3d768b5354057922dd77e';

async function analyze() {
  const tx = await client.getTransaction({ hash: TX_HASH });
  const receipt = await client.getTransactionReceipt({ hash: TX_HASH });
  
  console.log('=== TRANSACTION ANALYSIS ===\n');
  console.log('Hash:', TX_HASH);
  console.log('Status:', receipt.status);
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', formatEther(tx.value), 'HYPE');
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('\n--- Calldata ---');
  console.log('Full input:', tx.input);
  console.log('Function selector:', tx.input.slice(0, 10));
  
  console.log('\n--- Selector Check ---');
  console.log('Your selector:    ', tx.input.slice(0, 10));
  console.log('Wrong (bytes32):   0x2a2c63d9');
  console.log('Correct (bytes):   0x771c4fbf');
  
  if (tx.input.slice(0, 10) === '0x2a2c63d9') {
    console.log('\n❌ PROBLEM: You are calling depositNative(uint256,uint256,address,bytes32)');
    console.log('   But the contract has:  depositNative(uint256,uint256,address,bytes)');
    console.log('   The function signature does not exist on the contract!');
  } else if (tx.input.slice(0, 10) === '0x771c4fbf') {
    console.log('\n✓ Correct selector being used');
  }
  
  // Try to get revert reason
  try {
    await client.call({
      to: tx.to,
      data: tx.input,
      value: tx.value,
      account: tx.from,
      blockNumber: receipt.blockNumber - 1n,
    });
  } catch (e) {
    console.log('\n--- Revert Reason ---');
    console.log(e.shortMessage || e.message);
  }
}

analyze();
