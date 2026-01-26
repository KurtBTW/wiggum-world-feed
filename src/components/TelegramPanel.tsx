'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, Send, MessageSquare, Users, Radio, 
  RefreshCw, Settings, Check, X, Reply
} from 'lucide-react';

interface TelegramMessage {
  id: number;
  chatId: string;
  chatTitle: string;
  chatType: 'user' | 'group' | 'channel';
  senderId: string;
  senderName: string;
  text: string;
  date: string;
  replyToId?: number;
}

interface TelegramChat {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  unreadCount: number;
  lastMessage?: string;
  lastMessageDate?: string;
}

interface MonitoredChat {
  chatId: string;
  title: string;
  chatType: string;
  isMonitored: boolean;
}

interface TelegramPanelProps {
  onMessageSelect?: (message: TelegramMessage) => void;
}

export function TelegramPanel({ onMessageSelect }: TelegramPanelProps) {
  const [messages, setMessages] = useState<TelegramMessage[]>([]);
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [monitored, setMonitored] = useState<MonitoredChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyTo, setReplyTo] = useState<TelegramMessage | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/messages?monitored=true&limit=30');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (e) {
      console.error('Failed to fetch messages:', e);
    }
  }, []);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/chats?limit=50');
      const data = await res.json();
      if (data.chats) {
        setChats(data.chats);
      }
    } catch (e) {
      console.error('Failed to fetch chats:', e);
    }
  }, []);

  const fetchMonitored = useCallback(async () => {
    try {
      const res = await fetch('/api/telegram/monitor');
      const data = await res.json();
      if (data.chats) {
        setMonitored(data.chats);
      }
    } catch (e) {
      console.error('Failed to fetch monitored:', e);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchMonitored()]);
      setLoading(false);
    };
    load();

    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages, fetchMonitored]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
  };

  const toggleMonitor = async (chat: TelegramChat) => {
    const isCurrentlyMonitored = monitored.some(m => m.chatId === chat.id);
    
    await fetch('/api/telegram/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId: chat.id,
        title: chat.title,
        chatType: chat.type,
        monitored: !isCurrentlyMonitored,
      }),
    });

    await fetchMonitored();
  };

  const handleSend = async () => {
    if (!messageText.trim() || !replyTo) return;

    setSending(true);
    try {
      await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: replyTo.chatId,
          text: messageText,
          replyToId: replyTo.id,
        }),
      });

      setMessageText('');
      setReplyTo(null);
      await fetchMessages();
    } catch (e) {
      console.error('Failed to send:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return date.toLocaleDateString();
  };

  const getChatIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="w-4 h-4" />;
      case 'channel': return <Radio className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 text-[#0088cc] animate-spin" />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-medium text-white">Select Chats to Monitor</h3>
          <button
            onClick={() => { setShowSettings(false); fetchChats(); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="p-4 text-center">
              <button
                onClick={fetchChats}
                className="text-[#0088cc] hover:underline"
              >
                Load your chats
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {chats.map((chat) => {
                const isMonitored = monitored.some(m => m.chatId === chat.id);
                return (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleMonitor(chat)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      chat.type === 'channel' ? 'bg-purple-500/20 text-purple-400' :
                      chat.type === 'group' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {getChatIcon(chat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{chat.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{chat.lastMessage}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isMonitored 
                        ? 'bg-[#0088cc] border-[#0088cc]' 
                        : 'border-zinc-600'
                    }`}>
                      {isMonitored && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
          <span className="font-medium text-white">Telegram</span>
          <span className="text-xs text-zinc-500">({monitored.length} chats)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowSettings(true); fetchChats(); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">
            <p className="mb-2">No messages yet</p>
            <button
              onClick={() => { setShowSettings(true); fetchChats(); }}
              className="text-[#0088cc] hover:underline text-sm"
            >
              Select chats to monitor
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {messages.map((msg) => (
              <div
                key={`${msg.chatId}-${msg.id}`}
                className="p-3 hover:bg-white/5 cursor-pointer group"
                onClick={() => onMessageSelect?.(msg)}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.chatType === 'channel' ? 'bg-purple-500/20 text-purple-400' :
                    msg.chatType === 'group' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-zinc-500/20 text-zinc-400'
                  }`}>
                    {getChatIcon(msg.chatType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#0088cc] truncate">
                        {msg.chatTitle}
                      </span>
                      <span className="text-xs text-zinc-600">·</span>
                      <span className="text-xs text-zinc-500">{msg.senderName}</span>
                      <span className="text-xs text-zinc-600 ml-auto">{formatTime(msg.date)}</span>
                    </div>
                    <p className="text-sm text-zinc-300 mt-0.5 line-clamp-2">{msg.text}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReplyTo(msg);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                  >
                    <Reply className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {replyTo && (
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Reply className="w-4 h-4 text-[#0088cc]" />
            <span className="text-xs text-zinc-400">
              Replying to <span className="text-white">{replyTo.senderName}</span> in{' '}
              <span className="text-[#0088cc]">{replyTo.chatTitle}</span>
            </span>
            <button
              onClick={() => setReplyTo(null)}
              className="ml-auto p-1 hover:bg-white/10 rounded"
            >
              <X className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type your reply..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#0088cc]/50"
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || sending}
              className="px-3 py-2 bg-[#0088cc] text-white rounded-lg hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
