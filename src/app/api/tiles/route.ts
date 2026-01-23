// GET /api/tiles - Get current tile snapshots
import { NextResponse } from 'next/server';
import { getAllLatestSnapshots, updateAllTiles } from '@/services/tiles';
import { backfillMissingImages } from '@/services/ingestion';

export async function GET() {
  try {
    const tiles = await getAllLatestSnapshots();
    
    return NextResponse.json({
      tiles,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] Error fetching tiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tiles' },
      { status: 500 }
    );
  }
}

// POST /api/tiles - Trigger tile update (for manual refresh or scheduler)
export async function POST() {
  try {
    // Update tiles first
    const tiles = await updateAllTiles();
    
    // Backfill missing images (scrape article pages)
    const imagesBackfilled = await backfillMissingImages(15);
    
    return NextResponse.json({
      tiles,
      lastUpdated: new Date().toISOString(),
      imagesBackfilled,
      message: 'Tiles updated successfully'
    });
  } catch (error) {
    console.error('[API] Error updating tiles:', error);
    return NextResponse.json(
      { error: 'Failed to update tiles' },
      { status: 500 }
    );
  }
}
