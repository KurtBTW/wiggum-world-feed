'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, X, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react';
import type { ChatMessage, TileItem } from '@/types';

interface ChatTerminalProps {
  sessionId: string;
  boundItem: TileItem | null;
  onClearBoundItem: () => void;
}

export function ChatTerminal({ sessionId, boundItem, onClearBoundItem }: ChatTerminalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadHistory();
  }, [sessionId]);

  async function loadHistory() {
    try {
      const res = await fetch(`/api/chat?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setIsMinimized(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage,
          boundItemId: boundItem?.id,
          action: 'message'
        })
      });

      const data = await res.json();
      if (data.history) {
        setMessages(data.history);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function clearHistory() {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: '',
          action: 'clear'
        })
      });
      setMessages([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed right-4 bottom-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg border border-white/[0.08] bg-[#0F0F12] hover:bg-[#1A1A1D] transition-all shadow-lg group"
      >
        <MessageSquare className="w-4 h-4 text-zinc-400 group-hover:text-[#fbbf24] transition-colors" />
        <span className="text-sm text-zinc-300">Ask AI</span>
        {messages.length > 0 && (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-medium">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#0a0a0a] transition-all duration-300 ${
        isExpanded ? 'h-[60vh]' : 'h-72'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0F0F12]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#fbbf24]" />
            <span className="text-sm font-medium text-white">Chat</span>
          </div>
          {boundItem && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/20">
              <span className="text-[11px] text-[#22c55e] truncate max-w-[180px]">
                {boundItem.calmHeadline}
              </span>
              <button 
                onClick={onClearBoundItem} 
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3 text-[#22c55e]/60" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4 text-zinc-600 hover:text-zinc-400" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-600" />
            ) : (
              <ChevronUp className="w-4 h-4 text-zinc-600" />
            )}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
            title="Minimize"
          >
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        className="overflow-y-auto p-4 space-y-3" 
        style={{ height: 'calc(100% - 108px)' }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 mb-3 rounded-full bg-white/[0.03] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-sm text-zinc-500">Ask me anything about the news</p>
            <p className="text-xs text-zinc-600 mt-1">Click an item to add context</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#fbbf24]/20 to-[#22c55e]/20 border border-[#fbbf24]/20 text-white'
                    : 'bg-white/[0.03] border border-white/[0.06] text-zinc-200'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <Loader2 className="w-4 h-4 animate-spin text-[#fbbf24]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={boundItem ? `Ask about this article...` : 'Ask a question...'}
            className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#fbbf24]/30 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black font-medium text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
