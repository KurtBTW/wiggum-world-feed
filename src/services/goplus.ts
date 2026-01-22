// GoPlus Security API Service - Token security checks
import type { GoPlusSecurityResult, SupportedChain } from '@/types';

const BASE_URL = 'https://api.gopluslabs.io/api/v1';

// Chain ID mapping for GoPlus API
const CHAIN_ID_MAP: Record<SupportedChain, string> = {
  'ethereum': '1',
  'bsc': '56',
  'polygon': '137',
  'arbitrum': '42161',
  'avalanche': '43114',
  'base': '8453',
  'solana': 'solana',
  'sui': 'sui',
  'hyperliquid': 'hyperliquid', // May not be supported
  'berachain': '80084' // Testnet ID, may change
};

// Cache for security results (they don't change frequently)
const securityCache = new Map<string, { result: GoPlusSecurityResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Check token security using GoPlus API
 */
export async function checkTokenSecurity(
  chainId: SupportedChain,
  tokenAddress: string
): Promise<GoPlusSecurityResult | null> {
  const cacheKey = `${chainId}-${tokenAddress}`;
  
  // Check cache
  const cached = securityCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }
  
  const goPlusChainId = CHAIN_ID_MAP[chainId];
  if (!goPlusChainId) {
    console.log(`[GoPlus] Chain ${chainId} not supported`);
    return null;
  }
  
  try {
    const url = `${BASE_URL}/token_security/${goPlusChainId}?contract_addresses=${tokenAddress}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`GoPlus API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 1 || !data.result || !data.result[tokenAddress.toLowerCase()]) {
      console.log(`[GoPlus] No security data for ${tokenAddress} on ${chainId}`);
      return null;
    }
    
    const tokenData = data.result[tokenAddress.toLowerCase()];
    const result = parseSecurityResult(tokenData, chainId, tokenAddress);
    
    // Cache result
    securityCache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    console.error(`[GoPlus] Error checking security for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Parse GoPlus security response into our format
 */
function parseSecurityResult(
  data: any,
  chainId: string,
  tokenAddress: string
): GoPlusSecurityResult {
  // Parse boolean fields (GoPlus returns "0" or "1" as strings)
  const toBool = (val: any): boolean => val === '1' || val === 1 || val === true;
  const toNumber = (val: any): number => parseFloat(val) || 0;
  
  const isHoneypot = toBool(data.is_honeypot);
  const buyTax = toNumber(data.buy_tax) * 100;
  const sellTax = toNumber(data.sell_tax) * 100;
  const isOpenSource = toBool(data.is_open_source);
  const isProxy = toBool(data.is_proxy);
  const isMintable = toBool(data.is_mintable);
  const canTakeBackOwnership = toBool(data.can_take_back_ownership);
  const ownerChangeBalance = toBool(data.owner_change_balance);
  const hiddenOwner = toBool(data.hidden_owner);
  const selfDestruct = toBool(data.selfdestruct);
  const externalCall = toBool(data.external_call);
  const isAntiWhale = toBool(data.is_anti_whale);
  const tradingCooldown = toBool(data.trading_cooldown);
  const transferPausable = toBool(data.transfer_pausable);
  const isBlacklisted = toBool(data.is_blacklisted);
  const isWhitelisted = toBool(data.is_whitelisted);
  
  // Calculate trust score (0-100)
  let trustScore = 100;
  
  // Critical issues (major deductions)
  if (isHoneypot) trustScore -= 100; // Instant fail
  if (buyTax > 10) trustScore -= 30;
  if (sellTax > 10) trustScore -= 30;
  if (canTakeBackOwnership) trustScore -= 25;
  if (ownerChangeBalance) trustScore -= 25;
  if (hiddenOwner) trustScore -= 20;
  if (selfDestruct) trustScore -= 30;
  
  // Medium issues
  if (!isOpenSource) trustScore -= 15;
  if (isProxy) trustScore -= 10;
  if (isMintable) trustScore -= 15;
  if (externalCall) trustScore -= 10;
  if (transferPausable) trustScore -= 15;
  if (isBlacklisted) trustScore -= 10;
  
  // Minor issues
  if (isAntiWhale) trustScore -= 5;
  if (tradingCooldown) trustScore -= 5;
  
  // Ensure score is within bounds
  trustScore = Math.max(0, Math.min(100, trustScore));
  
  // Determine risk level
  let riskLevel: GoPlusSecurityResult['riskLevel'];
  if (trustScore >= 80) riskLevel = 'safe';
  else if (trustScore >= 60) riskLevel = 'low';
  else if (trustScore >= 40) riskLevel = 'medium';
  else if (trustScore >= 20) riskLevel = 'high';
  else riskLevel = 'critical';
  
  return {
    tokenAddress,
    chainId,
    isHoneypot,
    buyTax,
    sellTax,
    isOpenSource,
    isProxy,
    isMintable,
    canTakeBackOwnership,
    ownerChangeBalance,
    hiddenOwner,
    selfDestruct,
    externalCall,
    isAntiWhale,
    tradingCooldown,
    transferPausable,
    isBlacklisted,
    isWhitelisted,
    trustScore,
    riskLevel
  };
}

/**
 * Check if a token passes security requirements
 * Returns true if safe to display, false if should be hidden
 */
export function passesSecurityCheck(result: GoPlusSecurityResult | null): boolean {
  if (!result) {
    // If we can't check security, allow with caution
    return true;
  }
  
  // Auto-hide criteria:
  // - Honeypot
  // - Critical risk level
  // - High taxes (> 20%)
  // - Owner can change balance
  // - Can self-destruct
  
  if (result.isHoneypot) return false;
  if (result.riskLevel === 'critical') return false;
  if (result.buyTax > 20 || result.sellTax > 20) return false;
  if (result.ownerChangeBalance) return false;
  if (result.selfDestruct) return false;
  if (result.canTakeBackOwnership) return false;
  
  return true;
}

/**
 * Get security reasons for a token
 */
export function getSecurityReasons(result: GoPlusSecurityResult): string[] {
  const reasons: string[] = [];
  
  if (result.isHoneypot) reasons.push('Honeypot detected');
  if (result.buyTax > 10) reasons.push(`High buy tax: ${result.buyTax.toFixed(1)}%`);
  if (result.sellTax > 10) reasons.push(`High sell tax: ${result.sellTax.toFixed(1)}%`);
  if (!result.isOpenSource) reasons.push('Contract not verified');
  if (result.isProxy) reasons.push('Proxy contract');
  if (result.isMintable) reasons.push('Mintable token');
  if (result.canTakeBackOwnership) reasons.push('Owner can reclaim ownership');
  if (result.ownerChangeBalance) reasons.push('Owner can modify balances');
  if (result.hiddenOwner) reasons.push('Hidden owner');
  if (result.selfDestruct) reasons.push('Self-destruct function');
  if (result.externalCall) reasons.push('External calls detected');
  if (result.transferPausable) reasons.push('Transfers can be paused');
  if (result.isBlacklisted) reasons.push('Blacklist function');
  if (result.isAntiWhale) reasons.push('Anti-whale mechanism');
  if (result.tradingCooldown) reasons.push('Trading cooldown');
  
  return reasons;
}

/**
 * Batch check multiple tokens
 */
export async function batchCheckSecurity(
  tokens: Array<{ chainId: SupportedChain; tokenAddress: string }>
): Promise<Map<string, GoPlusSecurityResult>> {
  const results = new Map<string, GoPlusSecurityResult>();
  
  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const promises = batch.map(async ({ chainId, tokenAddress }) => {
      const result = await checkTokenSecurity(chainId, tokenAddress);
      if (result) {
        results.set(`${chainId}-${tokenAddress}`, result);
      }
    });
    
    await Promise.all(promises);
    
    // Small delay between batches
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * Get risk level color for UI
 */
export function getRiskLevelColor(riskLevel: GoPlusSecurityResult['riskLevel']): string {
  switch (riskLevel) {
    case 'safe': return '#22c55e'; // Green
    case 'low': return '#84cc16'; // Lime
    case 'medium': return '#eab308'; // Yellow
    case 'high': return '#f97316'; // Orange
    case 'critical': return '#ef4444'; // Red
    default: return '#6b7280'; // Gray
  }
}

/**
 * Get risk level label for UI
 */
export function getRiskLevelLabel(riskLevel: GoPlusSecurityResult['riskLevel']): string {
  switch (riskLevel) {
    case 'safe': return 'Safe';
    case 'low': return 'Low Risk';
    case 'medium': return 'Medium Risk';
    case 'high': return 'High Risk';
    case 'critical': return 'Critical';
    default: return 'Unknown';
  }
}
