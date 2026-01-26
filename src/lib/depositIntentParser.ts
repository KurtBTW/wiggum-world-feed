// Deposit Intent Parser - Extracts deposit intents from natural language
import { VaultType } from '@/contexts/ChatDepositContext';

export interface DepositIntent {
  detected: boolean;
  vault?: VaultType;
  amount?: string;
  stablecoin?: 'USDC' | 'USDT0';
  confidence: 'high' | 'medium' | 'low';
  needsConfirmation: boolean;
  missingInfo?: ('vault' | 'amount')[];
}

export interface WalletContext {
  address?: string;
  hypeBalance: string;
  usdcBalance: string;
  usdt0Balance: string;
}

// Vault name mappings
const VAULT_PATTERNS: Record<string, VaultType> = {
  // LHYPE - Looping Collective
  'lhype': 'lhype',
  'looping': 'lhype',
  'looping collective': 'lhype',
  'loopingcollective': 'lhype',
  
  // kHYPE - Kinetiq
  'khype': 'khype',
  'kinetiq': 'khype',
  'kinetiiq': 'khype',
  'liquid staking': 'khype',
  
  // xHYPE - Liminal
  'xhype': 'xhype',
  'liminal hype': 'xhype',
  'liminal xhype': 'xhype',
  'x hype': 'xhype',
  
  // xBTC - Liminal
  'xbtc': 'xbtc',
  'liminal btc': 'xbtc',
  'liminal xbtc': 'xbtc',
  'x btc': 'xbtc',
};

// Deposit trigger words
const DEPOSIT_TRIGGERS = [
  'deposit',
  'stake',
  'put',
  'invest',
  'add',
  'send',
  'transfer',
  'allocate',
];

// Stablecoin patterns
const STABLECOIN_PATTERNS: Record<string, 'USDC' | 'USDT0'> = {
  'usdc': 'USDC',
  'usdt': 'USDT0',
  'usdt0': 'USDT0',
  'tether': 'USDT0',
};

/**
 * Parse a message for deposit intent
 */
export function parseDepositIntent(message: string, walletContext?: WalletContext): DepositIntent {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for deposit trigger words
  const hasDepositTrigger = DEPOSIT_TRIGGERS.some(trigger => 
    lowerMessage.includes(trigger)
  );
  
  if (!hasDepositTrigger) {
    return { detected: false, confidence: 'low', needsConfirmation: false };
  }
  
  // Extract vault
  let detectedVault: VaultType | undefined;
  for (const [pattern, vault] of Object.entries(VAULT_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      detectedVault = vault;
      break;
    }
  }
  
  // Extract stablecoin preference (for xHYPE/xBTC)
  let detectedStablecoin: 'USDC' | 'USDT0' | undefined;
  for (const [pattern, coin] of Object.entries(STABLECOIN_PATTERNS)) {
    if (lowerMessage.includes(pattern)) {
      detectedStablecoin = coin;
      break;
    }
  }
  
  // Determine which balance to use based on vault type
  const isHypeVault = detectedVault === 'lhype' || detectedVault === 'khype';
  const relevantBalance = walletContext ? (
    isHypeVault 
      ? parseFloat(walletContext.hypeBalance) 
      : (detectedStablecoin === 'USDT0' 
          ? parseFloat(walletContext.usdt0Balance) 
          : parseFloat(walletContext.usdcBalance))
  ) : 0;
  
  // Extract amount - handle explicit numbers, percentages, and relative terms
  let detectedAmount: string | undefined;
  
  // First try explicit number
  const amountMatch = lowerMessage.match(
    /(\d+(?:\.\d+)?)\s*(?:hype|usdc|usdt|usdt0|dollars?|usd)?/i
  );
  
  if (amountMatch) {
    detectedAmount = amountMatch[1];
  } else if (walletContext && relevantBalance > 0) {
    // Try percentage match (e.g., "50%", "25 percent")
    const percentMatch = lowerMessage.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
    if (percentMatch) {
      const percent = parseFloat(percentMatch[1]) / 100;
      const calculatedAmount = relevantBalance * percent;
      detectedAmount = calculatedAmount.toFixed(4);
    }
    // Try "half" / "all" / "max" / "everything"
    else if (lowerMessage.includes('all') || lowerMessage.includes('max') || lowerMessage.includes('everything')) {
      detectedAmount = relevantBalance.toFixed(4);
    }
    else if (lowerMessage.includes('half')) {
      detectedAmount = (relevantBalance / 2).toFixed(4);
    }
    else if (lowerMessage.includes('quarter')) {
      detectedAmount = (relevantBalance / 4).toFixed(4);
    }
  }
  
  // Determine what info is missing
  const missingInfo: ('vault' | 'amount')[] = [];
  if (!detectedVault) missingInfo.push('vault');
  if (!detectedAmount) missingInfo.push('amount');
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (detectedVault && detectedAmount) {
    confidence = 'high';
  } else if (detectedVault || detectedAmount) {
    confidence = 'medium';
  }
  
  // If we detected a deposit trigger, always return detected=true
  return {
    detected: true,
    vault: detectedVault,
    amount: detectedAmount,
    stablecoin: detectedStablecoin,
    confidence,
    needsConfirmation: true, // Always confirm before executing
    missingInfo: missingInfo.length > 0 ? missingInfo : undefined,
  };
}

/**
 * Get vault display info for chat responses
 */
export function getVaultDisplayInfo(vault: VaultType): {
  name: string;
  token: string;
  apy: string;
  depositAsset: string;
  description: string;
} {
  switch (vault) {
    case 'lhype':
      return {
        name: 'Looping Collective',
        token: 'LHYPE',
        apy: 'Variable',
        depositAsset: 'HYPE',
        description: 'Liquid staking with auto-compounding rewards',
      };
    case 'khype':
      return {
        name: 'Kinetiq',
        token: 'kHYPE',
        apy: 'Variable',
        depositAsset: 'HYPE',
        description: 'Liquid staking protocol for HYPE',
      };
    case 'xhype':
      return {
        name: 'Liminal xHYPE',
        token: 'xHYPE',
        apy: 'Variable',
        depositAsset: 'USDC/USDT0',
        description: 'Delta-neutral HYPE exposure vault',
      };
    case 'xbtc':
      return {
        name: 'Liminal xBTC',
        token: 'xBTC',
        apy: 'Variable',
        depositAsset: 'USDC/USDT0',
        description: 'Delta-neutral BTC exposure vault',
      };
  }
}

/**
 * Generate chat response for deposit intent
 */
export function generateDepositResponse(intent: DepositIntent): string {
  if (!intent.detected) {
    return '';
  }
  
  // Missing vault
  if (!intent.vault) {
    return `I see you want to make a deposit. Which vault would you like to deposit into?

**Available Vaults:**
• **Kinetiq (kHYPE)** - Variable APY, deposit HYPE
• **Looping Collective (LHYPE)** - Variable APY, deposit HYPE  
• **Liminal xHYPE** - Variable APY, deposit USDC/USDT0
• **Liminal xBTC** - Variable APY, deposit USDC/USDT0

Just say something like "deposit into Kinetiq" or "stake in LHYPE".`;
  }
  
  const vaultInfo = getVaultDisplayInfo(intent.vault);
  
  // Missing amount
  if (!intent.amount) {
    return `Got it! You want to deposit into **${vaultInfo.name}** (${vaultInfo.apy} APY).

This vault accepts **${vaultInfo.depositAsset}**.

How much would you like to deposit? For example: "deposit 10 HYPE" or "stake 100"`;
  }
  
  // All info present - this will trigger the deposit card
  return `DEPOSIT_ACTION`;
}

/**
 * Check if a message is asking about vaults/yields (informational, not deposit)
 */
export function isVaultInfoQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const infoPatterns = [
    'what is',
    'what are',
    'tell me about',
    'explain',
    'how does',
    'what\'s the apy',
    'what\'s the yield',
    'compare',
    'which vault',
    'best vault',
    'highest yield',
    'highest apy',
  ];
  
  return infoPatterns.some(pattern => lowerMessage.includes(pattern));
}
