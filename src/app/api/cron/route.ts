// Vercel Cron endpoint for hourly updates
// Configure in vercel.json: { "crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }] }

import { NextResponse } from 'next/server';
import { updateAllTiles } from '@/services/tiles';
import { checkMarketMovements } from '@/services/market-data';

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`[Cron] Starting hourly update at ${new Date().toISOString()}`);

    // Update tiles
    const tiles = await updateAllTiles();
    
    // Check market movements
    const marketResults = await checkMarketMovements();
    
    const summary = {
      timestamp: new Date().toISOString(),
      tiles: Object.entries(tiles).map(([category, snapshot]) => ({
        category,
        itemCount: snapshot?.items.length || 0,
        wiggumPasses: snapshot?.wiggumPasses || 0
      })),
      market: marketResults.map(r => ({
        asset: r.asset,
        change: r.dailyChange.toFixed(2) + '%',
        triggered: r.triggered
      }))
    };

    console.log(`[Cron] Update completed:`, summary);

    return NextResponse.json({
      success: true,
      ...summary
    });
  } catch (error) {
    console.error('[Cron] Update failed:', error);
    return NextResponse.json(
      { error: 'Update failed', message: String(error) },
      { status: 500 }
    );
  }
}
