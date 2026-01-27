import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsForSymbol } from '@/services/news';

export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;
  
  try {
    const news = await fetchNewsForSymbol(symbol, 15);
    return NextResponse.json(news);
  } catch (error) {
    console.error(`Failed to fetch news for ${symbol}:`, error);
    return NextResponse.json([]);
  }
}
