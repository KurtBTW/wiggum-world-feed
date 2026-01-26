import { NextResponse } from 'next/server';
import { getChats, isAuthenticated } from '@/services/telegram';

export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const chats = await getChats(limit);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Failed to get chats:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
