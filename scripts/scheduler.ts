#!/usr/bin/env npx ts-node
/**
 * Wiggum World Feed - Hourly Scheduler
 * 
 * This script runs the tile update job hourly.
 * 
 * Usage:
 *   Development: npx ts-node scripts/scheduler.ts
 *   Production: Set up a cron job or use a service like Vercel Cron
 * 
 * Cron example (every hour at minute 0):
 *   0 * * * * cd /path/to/wiggum-world-feed && npx ts-node scripts/scheduler.ts
 */

import 'dotenv/config';

async function runUpdate() {
  console.log(`[${new Date().toISOString()}] Starting hourly update...`);
  
  try {
    // Import services dynamically to ensure proper initialization
    const { updateAllTiles } = await import('../src/services/tiles');
    const { checkMarketMovements } = await import('../src/services/market-data');
    
    // Update regular tiles
    console.log('[Scheduler] Updating tiles...');
    const results = await updateAllTiles();
    
    for (const [category, snapshot] of Object.entries(results)) {
      if (snapshot) {
        console.log(`[Scheduler] ${category}: ${snapshot.items.length} items (${snapshot.wiggumPasses} Wiggum passes)`);
      } else {
        console.log(`[Scheduler] ${category}: No updates`);
      }
    }
    
    // Check market movements
    console.log('[Scheduler] Checking market movements...');
    const marketResults = await checkMarketMovements();
    
    for (const result of marketResults) {
      if (result.triggered) {
        console.log(`[Scheduler] ALERT: ${result.asset} moved ${result.dailyChange.toFixed(2)}%`);
        console.log(`[Scheduler] Possible reasons: ${result.possibleReasons.join(', ')}`);
      } else {
        console.log(`[Scheduler] ${result.asset}: ${result.dailyChange.toFixed(2)}% (within threshold)`);
      }
    }
    
    console.log(`[${new Date().toISOString()}] Update completed successfully`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Update failed:`, error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runUpdate().then(() => {
    process.exit(0);
  });
}

export { runUpdate };
