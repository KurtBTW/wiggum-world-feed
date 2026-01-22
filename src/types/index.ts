// Wiggum World Feed - Type Definitions

export type Category = 'technology' | 'crypto' | 'ai' | 'business' | 'market_movements';

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
  technology: SourceConfig;
  crypto: SourceConfig;
  ai: SourceConfig;
  business: SourceConfig;
  market_movements: SourceConfig;
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

// Tile types
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
  date: Date;
  openPrice: number;
  closePrice: number;
  dailyChange: number;
  possibleReasons?: string[];
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
