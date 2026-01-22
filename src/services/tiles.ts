// Tile Service - Manages tile snapshots and updates
import { prisma } from '@/lib/prisma';
import { ingestCategory } from './ingestion';
import { scoreUnprocessedItems, getScoredCandidates } from './scoring';
import { executeWiggumLoop, hasNewQualifyingItems } from './wiggum-loop';
import { generateCalmHeadline, generateCalmSummary } from './calm-summary';
import { ALL_CATEGORIES, getCategoryThresholds } from './config';
import type { Category, TileSnapshot, TileItem, WiggumLoopMetrics } from '@/types';

/**
 * Update a single tile category
 * Implements "no new? keep tile" behavior
 */
export async function updateTile(category: Category): Promise<TileSnapshot | null> {
  console.log(`[Tiles] Starting update for ${category}`);
  
  // Step 1: Ingest new items
  const ingestResult = await ingestCategory(category);
  console.log(`[Tiles] Ingested ${ingestResult.newItems} new items for ${category}`);
  
  // Step 2: Score unprocessed items
  const scored = await scoreUnprocessedItems(category);
  console.log(`[Tiles] Scored ${scored} items for ${category}`);
  
  // Step 3: Check if there are new qualifying items
  const hasNew = await hasNewQualifyingItems(category);
  
  if (!hasNew) {
    console.log(`[Tiles] No new qualifying items for ${category}, keeping existing tile`);
    return getLatestSnapshot(category);
  }
  
  // Step 4: Get candidates and run Wiggum loop
  const candidates = await getScoredCandidates(category, 50);
  
  if (candidates.length === 0) {
    console.log(`[Tiles] No candidates for ${category}`);
    return getLatestSnapshot(category);
  }
  
  // Step 5: Execute Wiggum loop for iterative refinement
  const wiggumResult = await executeWiggumLoop(category, candidates);
  
  if (wiggumResult.selectedItems.length === 0) {
    console.log(`[Tiles] Wiggum loop selected no items for ${category}`);
    return getLatestSnapshot(category);
  }
  
  // Step 6: Create new snapshot
  const snapshot = await createSnapshot(category, wiggumResult);
  console.log(`[Tiles] Created new snapshot for ${category} with ${snapshot.items.length} items`);
  
  return snapshot;
}

/**
 * Update all tiles
 */
export async function updateAllTiles(): Promise<Record<Category, TileSnapshot | null>> {
  const results: Record<Category, TileSnapshot | null> = {} as Record<Category, TileSnapshot | null>;
  
  for (const category of ALL_CATEGORIES) {
    try {
      results[category] = await updateTile(category);
    } catch (error) {
      console.error(`[Tiles] Error updating ${category}:`, error);
      results[category] = await getLatestSnapshot(category);
    }
  }
  
  return results;
}

/**
 * Get the latest snapshot for a category
 */
export async function getLatestSnapshot(category: Category): Promise<TileSnapshot | null> {
  const snapshot = await prisma.tileSnapshot.findFirst({
    where: { category },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          ingestedItem: true
        },
        orderBy: { position: 'asc' }
      }
    }
  });
  
  if (!snapshot) return null;
  
  return transformSnapshot(snapshot);
}

/**
 * Get all latest snapshots
 */
export async function getAllLatestSnapshots(): Promise<Record<Category, TileSnapshot | null>> {
  const results: Record<Category, TileSnapshot | null> = {} as Record<Category, TileSnapshot | null>;
  
  for (const category of ALL_CATEGORIES) {
    results[category] = await getLatestSnapshot(category);
  }
  
  return results;
}

/**
 * Create a new tile snapshot from Wiggum loop result
 */
async function createSnapshot(
  category: Category,
  wiggumResult: {
    passNumber: number;
    acceptedAtPass?: number;
    metrics: WiggumLoopMetrics;
    selectedItems: any[];
  }
): Promise<TileSnapshot> {
  const thresholds = getCategoryThresholds(category);
  
  // Create the snapshot
  const snapshot = await prisma.tileSnapshot.create({
    data: {
      category,
      avgSensationalism: wiggumResult.metrics.avgSensationalism,
      avgOptimism: wiggumResult.metrics.avgOptimism,
      forwardProgressPct: wiggumResult.metrics.forwardProgressPct,
      itemCount: wiggumResult.selectedItems.length,
      sourceDiversity: wiggumResult.metrics.sourceDiversity,
      wiggumPasses: wiggumResult.passNumber,
      acceptedAtPass: wiggumResult.passNumber,
      finalThresholds: JSON.stringify(thresholds)
    }
  });
  
  // Create tile items
  for (let i = 0; i < wiggumResult.selectedItems.length; i++) {
    const item = wiggumResult.selectedItems[i];
    
    await prisma.tileItem.create({
      data: {
        snapshotId: snapshot.id,
        ingestedItemId: item.id,
        position: i,
        calmHeadline: item.calmHeadline || generateCalmHeadline(item.originalTitle),
        calmSummary: item.calmSummary || generateCalmSummary(item.originalTitle, item.excerpt || '', category)
      }
    });
    
    // Mark item as selected
    await prisma.ingestedItem.update({
      where: { id: item.id },
      data: { selectedForTile: true }
    });
  }
  
  // Fetch complete snapshot
  return (await getLatestSnapshot(category))!;
}

/**
 * Transform Prisma snapshot to API format
 */
function transformSnapshot(prismaSnapshot: any): TileSnapshot {
  return {
    id: prismaSnapshot.id,
    category: prismaSnapshot.category as Category,
    createdAt: prismaSnapshot.createdAt,
    updatedAt: prismaSnapshot.updatedAt,
    metrics: {
      avgSensationalism: prismaSnapshot.avgSensationalism,
      avgOptimism: prismaSnapshot.avgOptimism,
      forwardProgressPct: prismaSnapshot.forwardProgressPct,
      itemCount: prismaSnapshot.itemCount,
      sourceDiversity: prismaSnapshot.sourceDiversity,
      sources: prismaSnapshot.items.map((i: any) => i.ingestedItem.sourceName)
    },
    wiggumPasses: prismaSnapshot.wiggumPasses,
    acceptedAtPass: prismaSnapshot.acceptedAtPass || undefined,
    items: prismaSnapshot.items.map((item: any) => ({
      id: item.id,
      ingestedItemId: item.ingestedItemId,
      position: item.position,
      calmHeadline: item.calmHeadline,
      calmSummary: item.calmSummary,
      originalTitle: item.ingestedItem.originalTitle,
      source: item.ingestedItem.source,
      sourceName: item.ingestedItem.sourceName,
      url: item.ingestedItem.url,
      imageUrl: item.ingestedItem.imageUrl || undefined,
      publishedAt: item.ingestedItem.publishedAt,
      excerpt: item.ingestedItem.excerpt || undefined,
      // Token-specific fields
      chainId: item.ingestedItem.chainId || undefined,
      tokenAddress: item.ingestedItem.tokenAddress || undefined,
      securityScore: item.ingestedItem.securityScore || undefined,
      riskLevel: item.ingestedItem.riskLevel || undefined,
      priceUsd: item.ingestedItem.priceUsd || undefined,
      priceChange24h: item.ingestedItem.priceChange24h || undefined,
      volume24h: item.ingestedItem.volume24h || undefined,
      liquidity: item.ingestedItem.liquidity || undefined,
      // DeFi-specific fields
      tvl: item.ingestedItem.tvl || undefined,
      tvlChange24h: item.ingestedItem.tvlChange24h || undefined,
      apy: item.ingestedItem.apy || undefined
    }))
  };
}

/**
 * Get a single item by ID
 */
export async function getItemById(itemId: string) {
  const tileItem = await prisma.tileItem.findUnique({
    where: { id: itemId },
    include: {
      ingestedItem: true
    }
  });
  
  if (!tileItem) return null;
  
  return {
    item: {
      id: tileItem.id,
      ingestedItemId: tileItem.ingestedItemId,
      position: tileItem.position,
      calmHeadline: tileItem.calmHeadline,
      calmSummary: tileItem.calmSummary,
      originalTitle: tileItem.ingestedItem.originalTitle,
      source: tileItem.ingestedItem.source,
      sourceName: tileItem.ingestedItem.sourceName,
      url: tileItem.ingestedItem.url,
      imageUrl: tileItem.ingestedItem.imageUrl || undefined,
      publishedAt: tileItem.ingestedItem.publishedAt,
      excerpt: tileItem.ingestedItem.excerpt || undefined
    },
    ingestedItem: {
      id: tileItem.ingestedItem.id,
      title: tileItem.ingestedItem.title,
      originalTitle: tileItem.ingestedItem.originalTitle,
      url: tileItem.ingestedItem.url,
      canonicalUrl: tileItem.ingestedItem.canonicalUrl || undefined,
      source: tileItem.ingestedItem.source,
      sourceName: tileItem.ingestedItem.sourceName,
      category: tileItem.ingestedItem.category as Category,
      publishedAt: tileItem.ingestedItem.publishedAt,
      fetchedAt: tileItem.ingestedItem.fetchedAt,
      excerpt: tileItem.ingestedItem.excerpt || undefined,
      snippet: tileItem.ingestedItem.snippet || undefined,
      scores: {
        optimismScore: tileItem.ingestedItem.optimismScore,
        sensationalismScore: tileItem.ingestedItem.sensationalismScore,
        forwardProgressScore: tileItem.ingestedItem.forwardProgressScore,
        freshnessScore: tileItem.ingestedItem.freshnessScore,
        credibilityScore: tileItem.ingestedItem.credibilityScore,
        topicFitScore: tileItem.ingestedItem.topicFitScore,
        totalScore: tileItem.ingestedItem.totalScore
      }
    }
  };
}
