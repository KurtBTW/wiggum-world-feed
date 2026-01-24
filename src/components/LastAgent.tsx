'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Loader2, Sparkles, 
  Maximize2, Minimize2 
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function LastAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      const decoder = new TextDecoder();
      let done = false;
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value);
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg.role === 'assistant') {
              lastMsg.content += chunk;
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#50e2c3] text-black font-semibold rounded-full shadow-lg hover:bg-[#3fcbac] transition-all hover:scale-105"
      >
        <Sparkles className="w-5 h-5" />
        <span>Ask Last Agent</span>
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 bg-[#0f0f0f] border border-white/[0.1] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded 
          ? 'inset-4 md:inset-8' 
          : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh]'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#50e2c3]/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#50e2c3]" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Last Agent</h3>
            <p className="text-xs text-zinc-500">Your DeFi intelligence assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-zinc-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-zinc-400" />
            )}
          </button>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#50e2c3]/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#50e2c3]" />
            </div>
            <h4 className="text-white font-medium mb-2">How can I help you?</h4>
            <p className="text-zinc-500 text-sm mb-6">
              Ask me about partner protocols, recent announcements, or market insights.
            </p>
            <div className="space-y-2">
              {[
                "What's happening with HypurrFi?",
                "What are the latest announcements?",
                "Tell me about Euler's recent updates",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestion(suggestion)}
                  className="block w-full text-left px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#50e2c3] text-black'
                  : 'bg-white/[0.05] text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-white/[0.05] rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-[#50e2c3] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about protocols, announcements..."
            className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-[#50e2c3] text-black rounded-xl hover:bg-[#3fcbac] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearChat}
            className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear conversation
          </button>
        )}
      </form>
    </div>
  );
}
