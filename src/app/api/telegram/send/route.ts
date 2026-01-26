import { NextResponse } from 'next/server';
import { sendMessage, isAuthenticated } from '@/services/telegram';

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { chatId, text, replyToId } = await request.json();

    if (!chatId || !text) {
      return NextResponse.json({ error: 'chatId and text required' }, { status: 400 });
    }

    await sendMessage(chatId, text, replyToId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
