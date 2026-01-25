import { createPublicClient, http, parseEther, toFunctionSelector } from 'viem';

const RPC = 'https://rpc.hyperliquid.xyz/evm';
const DEPOSITOR = '0x6e358dd1204c3fb1D24e569DF0899f48faBE5337';

const client = createPublicClient({
  transport: http(RPC),
});

// Get function selector for depositNative
const selector = toFunctionSelector('depositNative(uint256,uint256,address,bytes32)');
console.log('Expected selector:', selector);

// Try to get contract code
async function check() {
  const code = await client.getBytecode({ address: DEPOSITOR });
  console.log('Contract has code:', !!code, 'length:', code?.length || 0);
  
  // Check if selector exists in bytecode
  const selectorHex = selector.slice(2);
  console.log('Selector in bytecode:', code?.includes(selectorHex) ? 'YES' : 'NO');
  
  // Try estimate gas with a real-ish scenario (will fail but gives us error)
  try {
    const gas = await client.estimateGas({
      to: DEPOSITOR,
      data: '0x' + selectorHex + '0'.repeat(256), // Padded args
      value: parseEther('0.01'),
    });
    console.log('Gas estimate:', gas);
  } catch (e) {
    console.log('Estimate error:', e.shortMessage || e.message);
  }
}

check();
