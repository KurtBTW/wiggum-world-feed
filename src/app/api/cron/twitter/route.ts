// Vercel Cron endpoint for daily Twitter ingestion at 11am EST (16:00 UTC)
// Configure in vercel.json: { "path": "/api/cron/twitter", "schedule": "0 16 * * *" }

import { NextResponse } from 'next/server';
import { ingestAllAccounts } from '@/services/twitter';

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log(`[Twitter Cron] Starting daily ingestion at ${new Date().toISOString()}`);

    const result = await ingestAllAccounts();

    const summary = {
      timestamp: new Date().toISOString(),
      totalTweetsIngested: result.total,
      byAccount: result.byAccount,
    };

    console.log(`[Twitter Cron] Ingestion completed:`, summary);

    return NextResponse.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    console.error('[Twitter Cron] Ingestion failed:', error);
    return NextResponse.json(
      { error: 'Twitter ingestion failed', message: String(error) },
      { status: 500 }
    );
  }
}
