// GET /api/tiles - Get current tile snapshots
import { NextResponse } from 'next/server';
import { getAllLatestSnapshots, updateAllTiles } from '@/services/tiles';

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
    const tiles = await updateAllTiles();
    
    return NextResponse.json({
      tiles,
      lastUpdated: new Date().toISOString(),
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
