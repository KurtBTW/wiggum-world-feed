// GET /api/tiles/[category] - Get more stories for a specific category
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Category } from '@/types';

const VALID_CATEGORIES = ['defi_alpha', 'token_launches', 'security_alerts', 'ai_frontier'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;
    
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch ingested items for this category, sorted by date
    const items = await prisma.ingestedItem.findMany({
      where: {
        category: category,
        // Only get processed items that aren't hidden
        processed: true,
        hiddenBySecurity: false
      },
      orderBy: [
        { publishedAt: 'desc' },
        { totalScore: 'desc' }
      ],
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        originalTitle: true,
        url: true,
        source: true,
        sourceName: true,
        category: true,
        publishedAt: true,
        excerpt: true,
        imageUrl: true,
        // Scores
        optimismScore: true,
        sensationalismScore: true,
        forwardProgressScore: true,
        totalScore: true,
        // Token fields
        chainId: true,
        tokenAddress: true,
        securityScore: true,
        riskLevel: true,
        priceUsd: true,
        priceChange24h: true,
        volume24h: true,
        liquidity: true,
        // DeFi fields
        tvl: true,
        tvlChange24h: true,
        apy: true,
        // Relevancy score
        relevancyScore: true,
        relevancyReason: true,
        // Check if already in a tile
        selectedForTile: true,
        // Get calm versions if they exist
        tileItems: {
          select: {
            calmHeadline: true,
            calmSummary: true
          },
          take: 1
        }
      }
    });

    // Transform to match TileItem format
    const transformedItems = items.map(item => ({
      id: item.id,
      ingestedItemId: item.id,
      position: 0,
      calmHeadline: item.tileItems[0]?.calmHeadline || item.title,
      calmSummary: item.tileItems[0]?.calmSummary || item.excerpt || '',
      originalTitle: item.originalTitle,
      source: item.source,
      sourceName: item.sourceName,
      url: item.url,
      imageUrl: item.imageUrl || undefined,
      publishedAt: item.publishedAt,
      excerpt: item.excerpt || undefined,
      // Token-specific fields
      chainId: item.chainId || undefined,
      tokenAddress: item.tokenAddress || undefined,
      securityScore: item.securityScore || undefined,
      riskLevel: item.riskLevel || undefined,
      priceUsd: item.priceUsd || undefined,
      priceChange24h: item.priceChange24h || undefined,
      volume24h: item.volume24h || undefined,
      liquidity: item.liquidity || undefined,
      // DeFi-specific fields
      tvl: item.tvl || undefined,
      tvlChange24h: item.tvlChange24h || undefined,
      apy: item.apy || undefined,
      // Relevancy score
      relevancyScore: item.relevancyScore || undefined,
      relevancyReason: item.relevancyReason || undefined,
      // Extra info
      isTopStory: item.selectedForTile
    }));

    // Get total count for pagination
    const totalCount = await prisma.ingestedItem.count({
      where: {
        category: category,
        processed: true,
        hiddenBySecurity: false
      }
    });

    return NextResponse.json({
      category,
      items: transformedItems,
      pagination: {
        offset,
        limit,
        total: totalCount,
        hasMore: offset + items.length < totalCount
      }
    });
  } catch (error) {
    console.error('[API] Error fetching category items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category items' },
      { status: 500 }
    );
  }
}
