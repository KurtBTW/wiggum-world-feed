import { toFunctionSelector } from 'viem';

// Wrong ABI (bytes32)
const wrongSelector = toFunctionSelector('depositNative(uint256,uint256,address,bytes32)');
console.log('Wrong selector (bytes32):', wrongSelector);

// Correct ABI (bytes)
const correctSelector = toFunctionSelector('depositNative(uint256,uint256,address,bytes)');
console.log('Correct selector (bytes):', correctSelector);

console.log('\nSuccessful tx uses: 0x771c4fbf');
