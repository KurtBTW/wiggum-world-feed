import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { prisma } from '@/lib/prisma';

const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
const apiHash = process.env.TELEGRAM_API_HASH || '';

let clientInstance: TelegramClient | null = null;
let connectionPromise: Promise<TelegramClient> | null = null;

export interface TelegramMessage {
  id: number;
  chatId: string;
  chatTitle: string;
  chatType: 'user' | 'group' | 'channel';
  senderId: string;
  senderName: string;
  text: string;
  date: Date;
  replyToId?: number;
}

export interface TelegramChatInfo {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: Date;
}

async function getStoredSession(): Promise<string> {
  const session = await prisma.telegramSession.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: 'desc' },
  });
  return session?.sessionData || '';
}

async function saveSession(sessionData: string, phoneNumber?: string): Promise<void> {
  const existing = await prisma.telegramSession.findFirst({
    where: { isActive: true },
  });

  if (existing) {
    await prisma.telegramSession.update({
      where: { id: existing.id },
      data: { sessionData, phoneNumber, updatedAt: new Date() },
    });
  } else {
    await prisma.telegramSession.create({
      data: { sessionData, phoneNumber },
    });
  }
}

export async function getClient(): Promise<TelegramClient> {
  if (clientInstance?.connected) {
    return clientInstance;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const sessionString = await getStoredSession();
    const session = new StringSession(sessionString);

    const client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.connect();
    clientInstance = client;
    connectionPromise = null;

    return client;
  })();

  return connectionPromise;
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const client = await getClient();
    const me = await client.getMe();
    return !!me;
  } catch {
    return false;
  }
}

export async function sendCode(phoneNumber: string): Promise<{ phoneCodeHash: string }> {
  const client = await getClient();
  const result = await client.sendCode(
    { apiId, apiHash },
    phoneNumber
  );
  return { phoneCodeHash: result.phoneCodeHash };
}

export async function signIn(
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string,
  password?: string
): Promise<{ success: boolean; needsPassword?: boolean }> {
  const client = await getClient();

  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );

    const sessionString = client.session.save() as unknown as string;
    await saveSession(sessionString, phoneNumber);

    return { success: true };
  } catch (error: unknown) {
    const err = error as { errorMessage?: string };
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED') {
      if (password) {
        await client.signInWithPassword(
          { apiId, apiHash },
          {
            password: async () => password,
            onError: (e) => { throw e; },
          }
        );

        const sessionString = client.session.save() as unknown as string;
        await saveSession(sessionString, phoneNumber);

        return { success: true };
      }
      return { success: false, needsPassword: true };
    }
    throw error;
  }
}

export async function getChats(limit = 50): Promise<TelegramChatInfo[]> {
  const client = await getClient();
  const dialogs = await client.getDialogs({ limit });

  return dialogs.map((dialog) => {
    let chatType: 'user' | 'group' | 'channel' = 'user';
    if (dialog.isGroup) chatType = 'group';
    if (dialog.isChannel) chatType = 'channel';

    return {
      id: dialog.id?.toString() || '',
      title: dialog.title || 'Unknown',
      type: chatType,
      unreadCount: dialog.unreadCount || 0,
      lastMessage: dialog.message?.message,
      lastMessageDate: dialog.message?.date ? new Date(dialog.message.date * 1000) : undefined,
    };
  });
}

export async function getMessages(chatId: string, limit = 50): Promise<TelegramMessage[]> {
  const client = await getClient();
  const entity = await client.getEntity(chatId);
  const messages = await client.getMessages(entity, { limit });

  const chatInfo = await client.getEntity(chatId);
  let chatTitle = 'Unknown';
  let chatType: 'user' | 'group' | 'channel' = 'user';

  if ('title' in chatInfo) {
    chatTitle = chatInfo.title || 'Unknown';
  }
  if ('firstName' in chatInfo) {
    chatTitle = `${chatInfo.firstName || ''} ${chatInfo.lastName || ''}`.trim();
  }
  if ('megagroup' in chatInfo || 'gigagroup' in chatInfo) {
    chatType = 'group';
  } else if ('broadcast' in chatInfo) {
    chatType = 'channel';
  }

  return messages
    .filter((msg) => msg.message)
    .map((msg) => {
      let senderName = 'Unknown';
      const sender = msg.sender;
      if (sender && 'firstName' in sender) {
        senderName = `${sender.firstName || ''} ${sender.lastName || ''}`.trim();
      } else if (sender && 'title' in sender) {
        senderName = sender.title || 'Unknown';
      }

      return {
        id: msg.id,
        chatId,
        chatTitle,
        chatType,
        senderId: msg.senderId?.toString() || '',
        senderName,
        text: msg.message || '',
        date: new Date(msg.date * 1000),
        replyToId: msg.replyTo?.replyToMsgId,
      };
    });
}

export async function sendMessage(chatId: string, text: string, replyToId?: number): Promise<boolean> {
  const client = await getClient();
  const entity = await client.getEntity(chatId);

  await client.sendMessage(entity, {
    message: text,
    replyTo: replyToId,
  });

  return true;
}

export async function getMonitoredChats(): Promise<TelegramChatInfo[]> {
  const monitored = await prisma.telegramChat.findMany({
    where: { isMonitored: true },
  });

  if (monitored.length === 0) {
    return [];
  }

  const allChats = await getChats(100);
  const monitoredIds = new Set(monitored.map((m) => m.chatId));

  return allChats.filter((chat) => monitoredIds.has(chat.id));
}

export async function setMonitoredChat(chatId: string, title: string, chatType: string, monitored: boolean): Promise<void> {
  const existing = await prisma.telegramChat.findUnique({
    where: { chatId },
  });

  if (existing) {
    await prisma.telegramChat.update({
      where: { chatId },
      data: { isMonitored: monitored },
    });
  } else {
    await prisma.telegramChat.create({
      data: { chatId, title, chatType, isMonitored: monitored },
    });
  }
}

export async function getRecentMessagesFromMonitored(limit = 20): Promise<TelegramMessage[]> {
  const monitored = await prisma.telegramChat.findMany({
    where: { isMonitored: true },
  });

  if (monitored.length === 0) {
    return [];
  }

  const allMessages: TelegramMessage[] = [];

  for (const chat of monitored) {
    try {
      const messages = await getMessages(chat.chatId, Math.ceil(limit / monitored.length));
      allMessages.push(...messages);
    } catch (e) {
      console.error(`Failed to get messages for chat ${chat.chatId}:`, e);
    }
  }

  return allMessages
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}
