// Scoring Service - Calculate optimism, sensationalism, forward-progress scores
import { prisma } from '@/lib/prisma';
import { 
  getScoringWeights, 
  getScoringPenalties, 
  getCategoryThresholds,
  getSourcesForCategory,
  mentionsMajorCompany,
  getCalmSummaryConfig
} from './config';
import type { Category, ItemScores, IngestedItemWithScores } from '@/types';

// Sensationalism indicators (penalize these)
const SENSATIONAL_WORDS = [
  'breaking', 'urgent', 'shocking', 'devastating', 'catastrophic',
  'explosive', 'bombshell', 'slam', 'destroy', 'annihilate',
  'chaos', 'crisis', 'panic', 'doom', 'disaster', 'nightmare',
  'insane', 'crazy', 'unbelievable', 'massive', 'huge', 'epic',
  'shocking', 'terrifying', 'horrifying', 'outrage', 'furious',
  'scandal', 'controversy', 'war', 'battle', 'fight', 'clash'
];

// Optimism/progress indicators (reward these)
const OPTIMISM_WORDS = [
  'launch', 'release', 'announce', 'introduce', 'unveil',
  'breakthrough', 'discover', 'achieve', 'succeed', 'improve',
  'grow', 'expand', 'advance', 'progress', 'develop', 'innovate',
  'partnership', 'collaborate', 'invest', 'fund', 'support',
  'milestone', 'record', 'first', 'new', 'next', 'future',
  'solution', 'solve', 'fix', 'upgrade', 'enhance', 'optimize'
];

// Forward progress indicators
const FORWARD_PROGRESS_WORDS = [
  'release', 'launch', 'prototype', 'research', 'discovery',
  'development', 'update', 'version', 'beta', 'alpha', 'preview',
  'mainnet', 'testnet', 'upgrade', 'deploy', 'ship', 'rollout',
  'funding', 'raised', 'acquisition', 'merger', 'partnership',
  'milestone', 'achievement', 'breakthrough', 'innovation'
];

/**
 * Calculate all scores for an item
 */
export function calculateScores(
  title: string,
  excerpt: string | null,
  credibilityScore: number,
  publishedAt: Date,
  category: Category
): ItemScores {
  const text = `${title} ${excerpt || ''}`.toLowerCase();
  const words = text.split(/\s+/);
  
  // Calculate individual scores
  const sensationalismScore = calculateSensationalism(text, words);
  const optimismScore = calculateOptimism(text, words);
  const forwardProgressScore = calculateForwardProgress(text, words);
  const freshnessScore = calculateFreshness(publishedAt);
  const topicFitScore = calculateTopicFit(text, category);
  
  // Calculate total score with weights
  const weights = getScoringWeights();
  const penalties = getScoringPenalties();
  
  let totalScore = 
    (optimismScore * weights.optimism) +
    (forwardProgressScore * weights.forwardProgress) +
    (credibilityScore * weights.credibility) +
    (freshnessScore * weights.freshness) +
    (topicFitScore * weights.topicFit);
  
  // Apply sensationalism penalty
  totalScore -= sensationalismScore * penalties.sensationalism;
  
  // Normalize to 0-1
  totalScore = Math.max(0, Math.min(1, totalScore));
  
  return {
    optimismScore,
    sensationalismScore,
    forwardProgressScore,
    freshnessScore,
    credibilityScore,
    topicFitScore,
    totalScore
  };
}

/**
 * Calculate sensationalism score (0-1, higher = more sensational)
 */
function calculateSensationalism(text: string, words: string[]): number {
  let count = 0;
  
  for (const word of SENSATIONAL_WORDS) {
    if (text.includes(word)) {
      count++;
    }
  }
  
  // Check for all caps words (excluding common acronyms)
  const capsWords = words.filter(w => 
    w.length > 3 && 
    w === w.toUpperCase() && 
    !/^[A-Z]{2,5}$/.test(w) // Allow short acronyms
  );
  count += capsWords.length * 0.5;
  
  // Check for excessive punctuation
  const exclamations = (text.match(/!/g) || []).length;
  count += exclamations * 0.3;
  
  // Normalize: assume 5+ indicators = max sensationalism
  return Math.min(1, count / 5);
}

/**
 * Calculate optimism score (0-1, higher = more optimistic)
 */
function calculateOptimism(text: string, words: string[]): number {
  let count = 0;
  
  for (const word of OPTIMISM_WORDS) {
    if (text.includes(word)) {
      count++;
    }
  }
  
  // Normalize: assume 4+ indicators = high optimism
  return Math.min(1, count / 4);
}

/**
 * Calculate forward progress score (0-1)
 */
function calculateForwardProgress(text: string, words: string[]): number {
  let count = 0;
  
  for (const word of FORWARD_PROGRESS_WORDS) {
    if (text.includes(word)) {
      count++;
    }
  }
  
  // Normalize: assume 3+ indicators = high forward progress
  return Math.min(1, count / 3);
}

/**
 * Calculate freshness score based on publication time (0-1)
 */
function calculateFreshness(publishedAt: Date): number {
  const now = new Date();
  const ageHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
  
  // Exponential decay: fresh items score higher
  // 0 hours = 1.0, 12 hours = 0.5, 24 hours = 0.25
  return Math.exp(-ageHours / 17.3); // decay constant for 12h half-life
}

/**
 * Calculate topic fit score for category (0-1)
 */
function calculateTopicFit(text: string, category: Category): number {
  const sourceConfig = getSourcesForCategory(category);
  const keywords = sourceConfig?.keywords || [];
  
  if (keywords.length === 0) return 0.5;
  
  let matches = 0;
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      matches++;
    }
  }
  
  // Normalize: 3+ keyword matches = high topic fit
  return Math.min(1, matches / 3);
}

/**
 * Score all unprocessed items for a category
 */
export async function scoreUnprocessedItems(category: Category): Promise<number> {
  const items = await prisma.ingestedItem.findMany({
    where: {
      category,
      processed: false
    }
  });
  
  let scored = 0;
  
  for (const item of items) {
    const scores = calculateScores(
      item.title,
      item.excerpt,
      item.credibilityScore,
      item.publishedAt,
      category as Category
    );
    
    // Apply business category filter
    if (category === 'business') {
      const thresholds = getCategoryThresholds(category);
      if (thresholds.requireCompanyMatch && !mentionsMajorCompany(item.title + ' ' + (item.excerpt || ''))) {
        // Mark as processed but don't include in results
        await prisma.ingestedItem.update({
          where: { id: item.id },
          data: {
            processed: true,
            ...scores,
            totalScore: 0 // Override to exclude from selection
          }
        });
        continue;
      }
    }
    
    await prisma.ingestedItem.update({
      where: { id: item.id },
      data: {
        processed: true,
        ...scores
      }
    });
    
    scored++;
  }
  
  return scored;
}

/**
 * Get scored candidates for a category
 */
export async function getScoredCandidates(
  category: Category,
  limit = 50
): Promise<IngestedItemWithScores[]> {
  const items = await prisma.ingestedItem.findMany({
    where: {
      category,
      processed: true,
      totalScore: {
        gt: 0
      }
    },
    orderBy: {
      totalScore: 'desc'
    },
    take: limit
  });
  
  return items.map(item => ({
    id: item.id,
    title: item.title,
    originalTitle: item.originalTitle,
    url: item.url,
    canonicalUrl: item.canonicalUrl || undefined,
    source: item.source,
    sourceName: item.sourceName,
    category: item.category as Category,
    publishedAt: item.publishedAt,
    fetchedAt: item.fetchedAt,
    excerpt: item.excerpt || undefined,
    snippet: item.snippet || undefined,
    scores: {
      optimismScore: item.optimismScore,
      sensationalismScore: item.sensationalismScore,
      forwardProgressScore: item.forwardProgressScore,
      freshnessScore: item.freshnessScore,
      credibilityScore: item.credibilityScore,
      topicFitScore: item.topicFitScore,
      totalScore: item.totalScore
    }
  }));
}
