// HypurrRelevancy - Type Definitions

// New focused categories for crypto traders and AI enthusiasts
export type Category = 'defi_alpha' | 'token_launches' | 'security_alerts' | 'ai_frontier';

// Supported chains for DEX Screener
export type SupportedChain = 
  | 'solana' 
  | 'ethereum' 
  | 'base' 
  | 'arbitrum' 
  | 'hyperliquid'
  | 'bsc' 
  | 'sui' 
  | 'avalanche' 
  | 'polygon' 
  | 'berachain';

export const SUPPORTED_CHAINS: SupportedChain[] = [
  'solana',
  'ethereum', 
  'base',
  'arbitrum',
  'hyperliquid',
  'bsc',
  'sui',
  'avalanche',
  'polygon',
  'berachain'
];

export interface Source {
  url: string;
  name: string;
  credibility: 'primary' | 'high' | 'medium' | 'low';
}

export interface SourceConfig {
  rss?: Source[];
  keywords?: string[];
  dataProviders?: DataProvider[];
  thresholdPercent?: number;
  newsCorpusHours?: number;
}

export interface DataProvider {
  name: string;
  assets?: Record<string, string>;
  apiKeyEnv?: string;
}

export interface SourcesConfig {
  defi_alpha: SourceConfig;
  token_launches: SourceConfig;
  security_alerts: SourceConfig;
  ai_frontier: SourceConfig;
}

// Scoring types
export interface ScoringWeights {
  optimism: number;
  forwardProgress: number;
  credibility: number;
  freshness: number;
  topicFit: number;
}

export interface ScoringPenalties {
  sensationalism: number;
  socialOnly: number;
  duplicateSource: number;
}

export interface ItemScores {
  optimismScore: number;
  sensationalismScore: number;
  forwardProgressScore: number;
  freshnessScore: number;
  credibilityScore: number;
  topicFitScore: number;
  totalScore: number;
}

// Category thresholds
export interface CategoryThresholds {
  targetItemCount: number;
  minItemCount: number;
  maxItemCount: number;
  maxSensationalism: number;
  minOptimism: number;
  minForwardProgressPct: number;
  maxSameSourceItems?: number;
  requireCompanyMatch?: boolean;
  thresholdPercent?: number;
}

// Wiggum Loop types
export interface WiggumLoopMetrics {
  avgSensationalism: number;
  avgOptimism: number;
  forwardProgressPct: number;
  itemCount: number;
  sourceDiversity: number;
  sources: string[];
}

export interface WiggumLoopParams {
  weights: ScoringWeights;
  thresholds: CategoryThresholds;
  penalties: ScoringPenalties;
}

export interface WiggumLoopAdjustment {
  type: 'weight' | 'threshold' | 'penalty';
  field: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface WiggumLoopResult {
  accepted: boolean;
  passNumber: number;
  metrics: WiggumLoopMetrics;
  adjustments: WiggumLoopAdjustment[];
  failureReasons: string[];
  selectedItems: IngestedItemWithScores[];
}

// Ingested item types
export interface IngestedItemWithScores {
  id: string;
  title: string;
  originalTitle: string;
  url: string;
  canonicalUrl?: string;
  source: string;
  sourceName: string;
  category: Category;
  publishedAt: Date;
  fetchedAt: Date;
  excerpt?: string;
  snippet?: string;
  scores: ItemScores;
}

// DEX Screener Token Types
export interface DexScreenerToken {
  chainId: string;
  tokenAddress: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  fdv?: number;
  pairAddress: string;
  dexId: string;
  url: string;
  imageUrl?: string;
  createdAt: number;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    m5: { buys: number; sells: number };
    h1: { buys: number; sells: number };
    h6: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    m5: number;
    h1: number;
    h6: number;
    h24: number;
  };
  liquidity: {
    usd: number;
    base: number;
    quote: number;
  };
  fdv: number;
  pairCreatedAt: number;
}

// GoPlus Security Types
export interface GoPlusSecurityResult {
  tokenAddress: string;
  chainId: string;
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  isOpenSource: boolean;
  isProxy: boolean;
  isMintable: boolean;
  canTakeBackOwnership: boolean;
  ownerChangeBalance: boolean;
  hiddenOwner: boolean;
  selfDestruct: boolean;
  externalCall: boolean;
  isAntiWhale: boolean;
  tradingCooldown: boolean;
  transferPausable: boolean;
  isBlacklisted: boolean;
  isWhitelisted: boolean;
  trustScore: number; // 0-100, calculated from all factors
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

// DefiLlama Types
export interface DefiLlamaProtocol {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  chains: string[];
  tvl: number;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  category: string;
  logo: string;
  url: string;
}

export interface DefiLlamaYield {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  underlyingTokens: string[];
}

// Tile types - Extended for new data
export interface TileItem {
  id: string;
  ingestedItemId: string;
  position: number;
  calmHeadline: string;
  calmSummary: string;
  originalTitle: string;
  source: string;
  sourceName: string;
  url: string;
  imageUrl?: string;
  publishedAt: Date;
  excerpt?: string;
  // New fields for token launches
  chainId?: string;
  tokenAddress?: string;
  securityScore?: number;
  riskLevel?: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  priceUsd?: number;
  priceChange24h?: number;
  volume24h?: number;
  liquidity?: number;
  // New fields for DeFi
  tvl?: number;
  tvlChange24h?: number;
  apy?: number;
  // Relevancy score
  relevancyScore?: number;
  relevancyReason?: string;
}

export interface TileSnapshot {
  id: string;
  category: Category;
  createdAt: Date;
  updatedAt: Date;
  metrics: WiggumLoopMetrics;
  wiggumPasses: number;
  acceptedAtPass?: number;
  items: TileItem[];
}

// Market data types
export interface MarketDataPoint {
  asset: string;
  symbol: string;
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdated: Date;
}

// Chat types
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  boundItemId?: string;
  createdAt: Date;
}

export interface ChatContext {
  item?: TileItem;
  sessionId: string;
}

// API response types
export interface TilesResponse {
  tiles: Record<Category, TileSnapshot | null>;
  lastUpdated: Date;
}

export interface ItemResponse {
  item: TileItem;
  ingestedItem: IngestedItemWithScores;
}

export interface ChatResponse {
  message: ChatMessage;
  history: ChatMessage[];
}

// Company types for business filtering
export interface Company {
  symbol?: string;
  name: string;
  aliases: string[];
}

export interface CompanyList {
  description: string;
  lastUpdated: string;
  companies: Company[];
}

// RSS feed item
export interface RSSFeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  creator?: string;
  isoDate?: string;
}

// Calm summary generation
export interface CalmSummaryRequest {
  originalTitle: string;
  excerpt?: string;
  source: string;
  category: Category;
}

export interface CalmSummaryResponse {
  headline: string;
  summary: string;
}

// Trending tokens response
export interface TrendingTokensResponse {
  tokens: DexScreenerToken[];
  lastUpdated: Date;
}

// Security check response
export interface SecurityCheckResponse {
  result: GoPlusSecurityResult;
  passed: boolean;
  reasons: string[];
}
