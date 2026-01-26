import { NextResponse } from 'next/server';
import { setMonitoredChat, getMonitoredChats, isAuthenticated } from '@/services/telegram';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const monitored = await prisma.telegramChat.findMany({
      where: { isMonitored: true },
    });

    return NextResponse.json({ chats: monitored });
  } catch (error) {
    console.error('Failed to get monitored chats:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { chatId, title, chatType, monitored } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: 'chatId required' }, { status: 400 });
    }

    await setMonitoredChat(chatId, title || 'Unknown', chatType || 'group', monitored ?? true);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update monitored chat:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
