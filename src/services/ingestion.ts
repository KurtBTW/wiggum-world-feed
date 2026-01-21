// RSS Feed Ingestion Service
import Parser from 'rss-parser';
import { prisma } from '@/lib/prisma';
import { getSourcesForCategory, getGlobalThresholds } from './config';
import type { Category, RSSFeedItem, Source } from '@/types';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'WiggumWorldFeed/1.0 (RSS Reader)',
  },
});

interface IngestResult {
  category: Category;
  totalFetched: number;
  newItems: number;
  duplicates: number;
  errors: string[];
}

/**
 * Ingest items from all RSS sources for a category
 */
export async function ingestCategory(category: Category): Promise<IngestResult> {
  const result: IngestResult = {
    category,
    totalFetched: 0,
    newItems: 0,
    duplicates: 0,
    errors: [],
  };

  const sourceConfig = getSourcesForCategory(category);
  if (!sourceConfig?.rss) {
    return result;
  }

  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  for (const source of sourceConfig.rss) {
    try {
      const items = await fetchRSSFeed(source);
      result.totalFetched += items.length;

      for (const item of items) {
        if (!item.link || !item.title) continue;

        // Check if within time window
        const publishedAt = item.isoDate ? new Date(item.isoDate) : new Date();
        if (publishedAt < windowStart) continue;

        // Check for duplicates
        const existing = await prisma.ingestedItem.findUnique({
          where: { url: item.link },
        });

        if (existing) {
          result.duplicates++;
          continue;
        }

        // Create new item
        try {
          await prisma.ingestedItem.create({
            data: {
              title: cleanTitle(item.title),
              originalTitle: item.title,
              url: item.link,
              canonicalUrl: extractCanonicalUrl(item.link),
              source: source.url,
              sourceName: source.name,
              category: category,
              publishedAt,
              excerpt: item.contentSnippet?.slice(0, 500),
              snippet: item.content?.slice(0, 1000),
              credibilityScore: getCredibilityScore(source.credibility),
            },
          });
          result.newItems++;
        } catch (createError) {
          // Likely a race condition duplicate
          result.duplicates++;
        }
      }
    } catch (error) {
      result.errors.push(`${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}

/**
 * Ingest all categories
 */
export async function ingestAllCategories(): Promise<IngestResult[]> {
  const categories: Category[] = ['technology', 'crypto', 'ai', 'business'];
  const results: IngestResult[] = [];

  for (const category of categories) {
    const result = await ingestCategory(category);
    results.push(result);
    console.log(`[Ingestion] ${category}: ${result.newItems} new, ${result.duplicates} duplicates`);
  }

  return results;
}

/**
 * Fetch items from an RSS feed
 */
async function fetchRSSFeed(source: Source): Promise<RSSFeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items as RSSFeedItem[];
  } catch (error) {
    console.error(`[RSS Error] ${source.name}: ${error}`);
    return [];
  }
}

/**
 * Clean up title text
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]/g, '') // Remove brackets
    .replace(/\(.*?\)/g, '') // Remove parentheses
    .trim();
}

/**
 * Extract canonical URL from a link
 */
function extractCanonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Get credibility score from credibility level
 */
function getCredibilityScore(credibility: string): number {
  switch (credibility) {
    case 'primary':
      return 1.0;
    case 'high':
      return 0.8;
    case 'medium':
      return 0.6;
    case 'low':
      return 0.4;
    default:
      return 0.5;
  }
}

/**
 * Get unprocessed items for a category
 */
export async function getUnprocessedItems(category: Category, limit = 100) {
  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  return prisma.ingestedItem.findMany({
    where: {
      category,
      processed: false,
      publishedAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get candidates for tile selection (already scored items)
 */
export async function getCandidatesForCategory(category: Category, limit = 50) {
  const globalThresholds = getGlobalThresholds();
  const windowStart = new Date(Date.now() - globalThresholds.ingestionWindowHours * 60 * 60 * 1000);

  return prisma.ingestedItem.findMany({
    where: {
      category,
      processed: true,
      publishedAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      totalScore: 'desc',
    },
    take: limit,
  });
}

/**
 * Mark items as processed
 */
export async function markItemsProcessed(ids: string[]) {
  await prisma.ingestedItem.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      processed: true,
    },
  });
}
