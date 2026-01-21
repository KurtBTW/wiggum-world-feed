// Wiggum Loop - 20-pass iterative refinement engine
// Uses Ralph Wiggum plugin as an "iteration advisor" to refine tile outputs
import { prisma } from '@/lib/prisma';
import { 
  getCategoryThresholds, 
  getScoringWeights, 
  getScoringPenalties,
  getWiggumLoopConfig 
} from './config';
import { getScoredCandidates } from './scoring';
import { generateCalmSummaries } from './calm-summary';
import type { 
  Category, 
  IngestedItemWithScores, 
  WiggumLoopMetrics, 
  WiggumLoopParams,
  WiggumLoopAdjustment,
  WiggumLoopResult,
  CategoryThresholds,
  ScoringWeights,
  ScoringPenalties
} from '@/types';

/**
 * Main Wiggum Loop execution
 * Runs up to 20 passes to refine tile selection
 */
export async function executeWiggumLoop(
  category: Category,
  candidates: IngestedItemWithScores[]
): Promise<WiggumLoopResult> {
  const config = getWiggumLoopConfig();
  const initialThresholds = getCategoryThresholds(category);
  const initialWeights = getScoringWeights();
  const initialPenalties = getScoringPenalties();
  
  let currentParams: WiggumLoopParams = {
    weights: { ...initialWeights },
    thresholds: { ...initialThresholds },
    penalties: { ...initialPenalties }
  };
  
  let bestResult: WiggumLoopResult | null = null;
  
  for (let pass = 1; pass <= config.maxPasses; pass++) {
    // Step 1: Select items with current parameters
    const selectedItems = selectItems(candidates, currentParams);
    
    // Step 2: Generate calm summaries (bounded length, no hype)
    const itemsWithSummaries = await generateCalmSummaries(selectedItems, category);
    
    // Step 3: Calculate metrics for this selection
    const metrics = calculateMetrics(itemsWithSummaries);
    
    // Step 4: Evaluate against acceptance criteria
    const { accepted, failureReasons } = evaluateAcceptance(metrics, currentParams.thresholds);
    
    // Log this pass
    await logWiggumPass(category, pass, metrics, currentParams, accepted, failureReasons);
    
    const result: WiggumLoopResult = {
      accepted,
      passNumber: pass,
      metrics,
      adjustments: [],
      failureReasons,
      selectedItems: itemsWithSummaries
    };
    
    // Step 5: If accepted, stop early
    if (accepted) {
      console.log(`[WiggumLoop] ${category} accepted at pass ${pass}`);
      return result;
    }
    
    // Keep track of best result so far
    if (!bestResult || metrics.avgSensationalism < bestResult.metrics.avgSensationalism) {
      bestResult = result;
    }
    
    // Step 6: Get adjustments from Ralph Wiggum advisor
    const adjustments = getWiggumAdjustments(metrics, currentParams, failureReasons, pass);
    result.adjustments = adjustments;
    
    // Apply adjustments for next pass
    currentParams = applyAdjustments(currentParams, adjustments);
  }
  
  // Return best result if we didn't accept within max passes
  console.log(`[WiggumLoop] ${category} did not accept after ${config.maxPasses} passes, using best result`);
  return bestResult!;
}

/**
 * Select items based on current parameters
 */
function selectItems(
  candidates: IngestedItemWithScores[],
  params: WiggumLoopParams
): IngestedItemWithScores[] {
  const { thresholds, penalties } = params;
  
  // Filter candidates by hard constraints
  let filtered = candidates.filter(item => 
    item.scores.sensationalismScore <= thresholds.maxSensationalism &&
    item.scores.optimismScore >= thresholds.minOptimism * 0.5 // Softer filter for selection
  );
  
  // Re-score with current weights
  const scored = filtered.map(item => ({
    ...item,
    adjustedScore: calculateAdjustedScore(item, params)
  }));
  
  // Sort by adjusted score
  scored.sort((a, b) => b.adjustedScore - a.adjustedScore);
  
  // Apply source diversity constraint
  const selected: typeof scored = [];
  const sourceCounts: Record<string, number> = {};
  
  const maxSameSource = thresholds.maxSameSourceItems || 3;
  for (const item of scored) {
    const sourceCount = sourceCounts[item.sourceName] || 0;
    if (sourceCount >= maxSameSource) {
      continue;
    }
    
    selected.push(item);
    sourceCounts[item.sourceName] = sourceCount + 1;
    
    if (selected.length >= thresholds.targetItemCount) {
      break;
    }
  }
  
  return selected;
}

/**
 * Calculate adjusted score with current weights
 */
function calculateAdjustedScore(
  item: IngestedItemWithScores,
  params: WiggumLoopParams
): number {
  const { weights, penalties } = params;
  const s = item.scores;
  
  let score = 
    (s.optimismScore * weights.optimism) +
    (s.forwardProgressScore * weights.forwardProgress) +
    (s.credibilityScore * weights.credibility) +
    (s.freshnessScore * weights.freshness) +
    (s.topicFitScore * weights.topicFit);
  
  // Apply penalties
  score -= s.sensationalismScore * penalties.sensationalism;
  
  return Math.max(0, score);
}

/**
 * Calculate metrics for a selection
 */
function calculateMetrics(items: IngestedItemWithScores[]): WiggumLoopMetrics {
  if (items.length === 0) {
    return {
      avgSensationalism: 0,
      avgOptimism: 0,
      forwardProgressPct: 0,
      itemCount: 0,
      sourceDiversity: 0,
      sources: []
    };
  }
  
  const avgSensationalism = items.reduce((sum, i) => sum + i.scores.sensationalismScore, 0) / items.length;
  const avgOptimism = items.reduce((sum, i) => sum + i.scores.optimismScore, 0) / items.length;
  
  const forwardProgressItems = items.filter(i => i.scores.forwardProgressScore >= 0.5);
  const forwardProgressPct = forwardProgressItems.length / items.length;
  
  const sources = [...new Set(items.map(i => i.sourceName))];
  
  return {
    avgSensationalism,
    avgOptimism,
    forwardProgressPct,
    itemCount: items.length,
    sourceDiversity: sources.length,
    sources
  };
}

/**
 * Evaluate if selection meets acceptance criteria
 */
function evaluateAcceptance(
  metrics: WiggumLoopMetrics,
  thresholds: CategoryThresholds
): { accepted: boolean; failureReasons: string[] } {
  const failureReasons: string[] = [];
  
  // Check item count
  if (metrics.itemCount < thresholds.minItemCount) {
    failureReasons.push(`Item count ${metrics.itemCount} below minimum ${thresholds.minItemCount}`);
  }
  
  // Check sensationalism (HARD CONSTRAINT)
  if (metrics.avgSensationalism > thresholds.maxSensationalism) {
    failureReasons.push(`Avg sensationalism ${metrics.avgSensationalism.toFixed(3)} above max ${thresholds.maxSensationalism}`);
  }
  
  // Check forward progress
  if (metrics.forwardProgressPct < thresholds.minForwardProgressPct) {
    failureReasons.push(`Forward progress ${(metrics.forwardProgressPct * 100).toFixed(1)}% below min ${thresholds.minForwardProgressPct * 100}%`);
  }
  
  // Check optimism
  if (metrics.avgOptimism < thresholds.minOptimism) {
    failureReasons.push(`Avg optimism ${metrics.avgOptimism.toFixed(3)} below min ${thresholds.minOptimism}`);
  }
  
  // Check source diversity (soft constraint - warn but don't fail)
  if (metrics.sourceDiversity === 1 && metrics.itemCount > 2) {
    failureReasons.push(`Low source diversity: all items from ${metrics.sources[0]}`);
  }
  
  return {
    accepted: failureReasons.length === 0,
    failureReasons
  };
}

/**
 * Get adjustment recommendations from Ralph Wiggum advisor
 * This is the "black box" iteration advisor that proposes parameter changes
 */
function getWiggumAdjustments(
  metrics: WiggumLoopMetrics,
  currentParams: WiggumLoopParams,
  failureReasons: string[],
  passNumber: number
): WiggumLoopAdjustment[] {
  const adjustments: WiggumLoopAdjustment[] = [];
  const step = getWiggumLoopConfig().adjustmentStep;
  
  // Analyze failure reasons and propose adjustments
  for (const reason of failureReasons) {
    if (reason.includes('sensationalism')) {
      // Increase sensationalism penalty
      const oldValue = currentParams.penalties.sensationalism;
      adjustments.push({
        type: 'penalty',
        field: 'sensationalism',
        oldValue,
        newValue: Math.min(1, oldValue + step),
        reason: 'Reduce sensationalism by increasing penalty'
      });
    }
    
    if (reason.includes('forward progress')) {
      // Increase forward progress weight
      const oldValue = currentParams.weights.forwardProgress;
      adjustments.push({
        type: 'weight',
        field: 'forwardProgress',
        oldValue,
        newValue: Math.min(0.5, oldValue + step),
        reason: 'Prioritize forward-progress items'
      });
    }
    
    if (reason.includes('optimism')) {
      // Increase optimism weight and lower minimum slightly
      const oldWeight = currentParams.weights.optimism;
      adjustments.push({
        type: 'weight',
        field: 'optimism',
        oldValue: oldWeight,
        newValue: Math.min(0.5, oldWeight + step),
        reason: 'Prioritize optimistic items'
      });
      
      // Also slightly relax minimum if too restrictive
      if (passNumber > 10) {
        const oldThreshold = currentParams.thresholds.minOptimism;
        adjustments.push({
          type: 'threshold',
          field: 'minOptimism',
          oldValue: oldThreshold,
          newValue: Math.max(0.2, oldThreshold - step * 0.5),
          reason: 'Slightly relax optimism minimum to get more candidates'
        });
      }
    }
    
    if (reason.includes('source diversity')) {
      // Increase credibility weight to prefer diverse primary sources
      const oldValue = currentParams.weights.credibility;
      adjustments.push({
        type: 'weight',
        field: 'credibility',
        oldValue,
        newValue: Math.min(0.4, oldValue + step),
        reason: 'Prioritize primary sources for diversity'
      });
    }
    
    if (reason.includes('Item count')) {
      // Relax some thresholds to get more items
      const oldSensMax = currentParams.thresholds.maxSensationalism;
      // NEVER relax sensationalism above the strict cap
      const strictCap = 0.4;
      if (oldSensMax < strictCap) {
        adjustments.push({
          type: 'threshold',
          field: 'maxSensationalism',
          oldValue: oldSensMax,
          newValue: Math.min(strictCap, oldSensMax + step * 0.5),
          reason: 'Slightly relax sensationalism to get more items (within strict cap)'
        });
      }
    }
  }
  
  // Progressive adjustments based on pass number
  if (passNumber > 5 && adjustments.length === 0) {
    // No specific adjustments, try general refinement
    adjustments.push({
      type: 'weight',
      field: 'freshness',
      oldValue: currentParams.weights.freshness,
      newValue: Math.min(0.3, currentParams.weights.freshness + step),
      reason: 'Progressive: prioritize fresher items'
    });
  }
  
  return adjustments;
}

/**
 * Apply adjustments to parameters
 */
function applyAdjustments(
  params: WiggumLoopParams,
  adjustments: WiggumLoopAdjustment[]
): WiggumLoopParams {
  const newParams = {
    weights: { ...params.weights },
    thresholds: { ...params.thresholds },
    penalties: { ...params.penalties }
  };
  
  for (const adj of adjustments) {
    switch (adj.type) {
      case 'weight':
        (newParams.weights as unknown as Record<string, number>)[adj.field] = adj.newValue;
        break;
      case 'threshold':
        (newParams.thresholds as unknown as Record<string, number>)[adj.field] = adj.newValue;
        break;
      case 'penalty':
        (newParams.penalties as unknown as Record<string, number>)[adj.field] = adj.newValue;
        break;
    }
  }
  
  // Normalize weights to sum to 1
  const weightSum = Object.values(newParams.weights).reduce((a, b) => a + b, 0);
  if (weightSum > 0) {
    for (const key of Object.keys(newParams.weights)) {
      (newParams.weights as unknown as Record<string, number>)[key] /= weightSum;
    }
  }
  
  return newParams;
}

/**
 * Log a Wiggum pass for debugging
 */
async function logWiggumPass(
  category: Category,
  passNumber: number,
  metrics: WiggumLoopMetrics,
  params: WiggumLoopParams,
  accepted: boolean,
  failureReasons: string[]
) {
  await prisma.wiggumLoopLog.create({
    data: {
      category,
      passNumber,
      inputMetrics: JSON.stringify(metrics),
      inputThresholds: JSON.stringify(params.thresholds),
      accepted,
      failureReasons: failureReasons.length > 0 ? JSON.stringify(failureReasons) : null
    }
  });
}

/**
 * Check if there are new qualifying items since last snapshot
 */
export async function hasNewQualifyingItems(category: Category): Promise<boolean> {
  const lastSnapshot = await prisma.tileSnapshot.findFirst({
    where: { category },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  
  if (!lastSnapshot) {
    return true; // No snapshot exists, definitely need to create one
  }
  
  // Get candidates since last snapshot
  const candidates = await getScoredCandidates(category, 50);
  const lastItemIds = new Set(lastSnapshot.items.map(i => i.ingestedItemId));
  
  // Check if any new high-quality items exist
  const newItems = candidates.filter(c => 
    !lastItemIds.has(c.id) &&
    c.scores.totalScore > 0.5 // Basic quality threshold
  );
  
  return newItems.length > 0;
}
