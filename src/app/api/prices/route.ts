import { NextResponse } from 'next/server';
import { fetchAllPrices } from '@/services/prices';

export const revalidate = 60;

export async function GET() {
  const prices = await fetchAllPrices();
  return NextResponse.json({ prices, updatedAt: new Date().toISOString() });
}
