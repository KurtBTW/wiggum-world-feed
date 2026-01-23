'use client';

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Send, Loader2, Trash2, X, ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';
import type { ChatMessage, TileItem } from '@/types';

export interface ChatTerminalHandle {
  openAndExplain: (item: TileItem) => void;
}

interface ChatTerminalProps {
  sessionId: string;
  boundItem: TileItem | null;
  onClearBoundItem: () => void;
}

export const ChatTerminal = forwardRef<ChatTerminalHandle, ChatTerminalProps>(
  function ChatTerminal({ sessionId, boundItem, onClearBoundItem }, ref) {
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

    // Expose method to parent to open chat and explain
    useImperativeHandle(ref, () => ({
      openAndExplain: async (item: TileItem) => {
        setIsMinimized(false);
        setIsLoading(true);
        
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              message: '',
              boundItemId: item.id,
              action: 'explain'
            })
          });

          const data = await res.json();
          if (data.history) {
            setMessages(data.history);
          }
        } catch (error) {
          console.error('Failed to explain item:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }));

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

    // Minimized floating button
    if (isMinimized) {
      return (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed right-6 bottom-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border border-white/[0.1] bg-gradient-to-r from-[#fbbf24]/10 to-[#22c55e]/10 hover:from-[#fbbf24]/20 hover:to-[#22c55e]/20 transition-all shadow-2xl shadow-black/50 group backdrop-blur-sm"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#22c55e] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <div className="text-left">
            <span className="text-sm font-medium text-white block">HypurrAI</span>
            <span className="text-[10px] text-zinc-500">Ask anything</span>
          </div>
          {messages.length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#22c55e] text-black text-[10px] font-bold">
              {messages.length}
            </span>
          )}
        </button>
      );
    }

    // Expanded floating panel
    return (
      <div 
        className={`fixed right-6 bottom-6 z-50 flex flex-col border border-white/[0.1] bg-[#0a0a0a]/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 transition-all duration-300 ${
          isExpanded ? 'w-[420px] h-[70vh]' : 'w-[380px] h-[450px]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] rounded-t-2xl bg-gradient-to-r from-[#fbbf24]/5 to-[#22c55e]/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#fbbf24] to-[#22c55e] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <div>
              <span className="text-sm font-semibold text-white">HypurrAI</span>
              <span className="text-[10px] text-zinc-500 block">Powered by OpenAI</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              )}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title="Minimize"
            >
              <X className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Bound Item Badge */}
        {boundItem && (
          <div className="px-4 py-2 border-b border-white/[0.06] bg-[#22c55e]/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Context:</span>
              <span className="text-[11px] text-[#22c55e] truncate flex-1">
                {boundItem.calmHeadline}
              </span>
              <button 
                onClick={onClearBoundItem} 
                className="hover:text-white transition-colors"
              >
                <X className="w-3 h-3 text-[#22c55e]/60" />
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3"
        >
          {messages.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-[#fbbf24]/10 to-[#22c55e]/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400 font-medium mb-1">Ask me anything</p>
              <p className="text-xs text-zinc-600">
                Get AI insights about news, trends, or click an article to ask about it
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black font-medium'
                      : 'bg-white/[0.05] border border-white/[0.08] text-zinc-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#fbbf24]" />
                  <span className="text-xs text-zinc-500">Summarizing article...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t border-white/[0.08]">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={boundItem ? `Ask about this article...` : 'Ask anything...'}
              className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#fbbf24]/40 focus:bg-white/[0.08] transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#22c55e] text-black font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    );
  }
);
