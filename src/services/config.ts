// Configuration loader service
import sourcesConfig from '../../config/sources.json';
import thresholdsConfig from '../../config/thresholds.json';
import type { 
  SourcesConfig, 
  CategoryThresholds, 
  ScoringWeights, 
  ScoringPenalties,
  Category 
} from '@/types';

// Sources configuration
export function getSources(): SourcesConfig {
  return sourcesConfig as unknown as SourcesConfig;
}

export function getSourcesForCategory(category: Category) {
  const sources = getSources();
  return sources[category];
}

// Get API config for a category
export function getApiConfig(category: Category) {
  const config = sourcesConfig as any;
  return config[category]?.apis || null;
}

// Get chains config for token launches
export function getSupportedChains(): string[] {
  const config = sourcesConfig as any;
  return config.token_launches?.chains || [];
}

// Get market data assets
export function getMarketDataAssets() {
  const config = sourcesConfig as any;
  return config.marketData?.assets || [];
}

// Thresholds configuration
export function getGlobalThresholds() {
  return thresholdsConfig.global;
}

export function getCategoryThresholds(category: Category): CategoryThresholds {
  // Map new categories to threshold configs
  const thresholdMap: Record<Category, keyof typeof thresholdsConfig.categories> = {
    'defi_alpha': 'crypto' as any,
    'token_launches': 'crypto' as any,
    'security_alerts': 'crypto' as any,
    'ai_frontier': 'ai' as any
  };
  
  const mappedCategory = thresholdMap[category] || 'crypto';
  return thresholdsConfig.categories[mappedCategory as keyof typeof thresholdsConfig.categories] || 
    thresholdsConfig.categories.crypto;
}

export function getScoringWeights(): ScoringWeights {
  return thresholdsConfig.scoring.weights;
}

export function getScoringPenalties(): ScoringPenalties {
  return thresholdsConfig.scoring.penalties;
}

export function getWiggumLoopConfig() {
  return thresholdsConfig.wiggumLoop;
}

export function getCalmSummaryConfig() {
  return thresholdsConfig.calmSummary;
}

// Category display names
export const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
  defi_alpha: 'DeFi Alpha',
  token_launches: 'Token Launches',
  security_alerts: 'Security Alerts',
  ai_frontier: 'AI Frontier'
};

// Category icons/emojis for UI
export const CATEGORY_ICONS: Record<Category, string> = {
  defi_alpha: '💎',
  token_launches: '🚀',
  security_alerts: '🚨',
  ai_frontier: '🤖'
};

export const ALL_CATEGORIES: Category[] = [
  'defi_alpha',
  'token_launches',
  'security_alerts',
  'ai_frontier'
];

// RSS-based categories (ingested via RSS feeds)
export const RSS_CATEGORIES: Category[] = [
  'defi_alpha',
  'security_alerts',
  'ai_frontier'
];

// API-based categories (fetched via external APIs like DEX Screener)
export const API_CATEGORIES: Category[] = [
  'token_launches'
];
