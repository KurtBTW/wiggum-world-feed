import { NextResponse } from 'next/server';
import { getMessages, getRecentMessagesFromMonitored, isAuthenticated } from '@/services/telegram';

export async function GET(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const monitored = searchParams.get('monitored') === 'true';

    if (monitored) {
      const messages = await getRecentMessagesFromMonitored(limit);
      return NextResponse.json({ messages });
    }

    if (!chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }

    const messages = await getMessages(chatId, limit);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to get messages:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
