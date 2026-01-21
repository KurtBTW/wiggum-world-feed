'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Trash2, X, Maximize2, Minimize2 } from 'lucide-react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
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

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 transition-all ${
      isExpanded ? 'h-[60vh]' : 'h-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Chat Terminal</span>
          {boundItem && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-300">
              <span className="truncate max-w-[200px]">Context: {boundItem.calmHeadline}</span>
              <button onClick={onClearBoundItem} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Clear history"
          >
            <Trash2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 110px)' }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p className="text-sm">Ask me anything about the news items.</p>
            <p className="text-xs mt-1">Click an item to bind it as context.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 bg-gray-800 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={boundItem ? `Ask about "${boundItem.calmHeadline.slice(0, 30)}..."` : 'Ask a question...'}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
