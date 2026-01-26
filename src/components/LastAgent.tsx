'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, X, Send, Loader2, Sparkles, 
  Maximize2, Minimize2, Wallet, CheckCircle, XCircle, ExternalLink, ArrowRight
} from 'lucide-react';
import { useChatDeposit, VaultType } from '@/contexts/ChatDepositContext';
import type { DepositAction } from '@/app/api/agent/chat/route';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  action?: DepositAction;
}

function DepositCard({ 
  action, 
  onComplete, 
  onCancel 
}: { 
  action: DepositAction; 
  onComplete: () => void; 
  onCancel: () => void;
}) {
  const { 
    isConnected, 
    hypeBalance, 
    usdcBalance, 
    usdt0Balance,
    depositState,
    executeDeposit,
    resetDepositState,
  } = useChatDeposit();
  
  const [selectedStablecoin, setSelectedStablecoin] = useState<'USDC' | 'USDT0'>(
    action.stablecoin || 'USDC'
  );

  const isHypeVault = action.vault === 'lhype' || action.vault === 'khype';
  const currentBalance = isHypeVault 
    ? hypeBalance 
    : (selectedStablecoin === 'USDC' ? usdcBalance : usdt0Balance);
  
  const hasInsufficientBalance = parseFloat(action.amount) > parseFloat(currentBalance);

  useEffect(() => {
    if (depositState.status === 'success') {
      const timer = setTimeout(() => {
        onComplete();
        resetDepositState();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [depositState.status, onComplete, resetDepositState]);

  const handleDeposit = async () => {
    await executeDeposit({
      vault: action.vault as VaultType,
      amount: action.amount,
      stablecoin: isHypeVault ? undefined : selectedStablecoin,
    });
  };

  const handleCancel = () => {
    resetDepositState();
    onCancel();
  };

  if (!isConnected) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.1] rounded-xl p-4 max-w-[320px]">
        <div className="flex items-center gap-2 text-amber-400 mb-3">
          <Wallet className="w-5 h-5" />
          <span className="font-medium">Wallet Required</span>
        </div>
        <p className="text-sm text-zinc-400 mb-3">
          Connect your wallet to make deposits.
        </p>
        <button
          onClick={onCancel}
          className="w-full px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  if (depositState.status === 'success') {
    return (
      <div className="bg-white/[0.03] border border-emerald-500/30 rounded-xl p-4 max-w-[320px]">
        <div className="flex items-center gap-2 text-emerald-400 mb-3">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Deposit Successful!</span>
        </div>
        <p className="text-sm text-zinc-400 mb-3">
          Deposited {action.amount} {isHypeVault ? 'HYPE' : selectedStablecoin} into {action.vaultInfo.name}
        </p>
        {depositState.txHash && (
          <a
            href={`https://purrsec.com/tx/${depositState.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            View transaction <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  }

  if (depositState.status === 'error') {
    return (
      <div className="bg-white/[0.03] border border-red-500/30 rounded-xl p-4 max-w-[320px]">
        <div className="flex items-center gap-2 text-red-400 mb-3">
          <XCircle className="w-5 h-5" />
          <span className="font-medium">Deposit Failed</span>
        </div>
        <p className="text-sm text-zinc-400 mb-3">
          {depositState.error || 'Transaction was rejected or failed'}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDeposit}
            className="flex-1 px-4 py-2 text-sm bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const isPending = depositState.status === 'pending' || depositState.status === 'confirming';

  return (
    <div className="bg-white/[0.03] border border-white/[0.1] rounded-xl p-4 max-w-[320px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">Confirm Deposit</span>
        <span className="text-xs px-2 py-0.5 bg-[#50e2c3]/20 text-[#50e2c3] rounded-full">
          {action.vaultInfo.apy} APY
        </span>
      </div>

      <div className="bg-black/30 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Amount</span>
          <span className="text-xs text-zinc-500">
            Balance: {parseFloat(currentBalance).toFixed(4)} {isHypeVault ? 'HYPE' : selectedStablecoin}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-white">{action.amount}</span>
          <span className="text-sm text-zinc-400">{isHypeVault ? 'HYPE' : selectedStablecoin}</span>
        </div>
      </div>

      {!isHypeVault && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSelectedStablecoin('USDC')}
            disabled={isPending}
            className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              selectedStablecoin === 'USDC'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05]'
            }`}
          >
            USDC
          </button>
          <button
            onClick={() => setSelectedStablecoin('USDT0')}
            disabled={isPending}
            className={`flex-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              selectedStablecoin === 'USDT0'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/[0.03] text-zinc-400 hover:bg-white/[0.05]'
            }`}
          >
            USDT0
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
        <ArrowRight className="w-3 h-3" />
        <span>Receive {action.vaultInfo.token} from {action.vaultInfo.name}</span>
      </div>

      {hasInsufficientBalance && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
          <p className="text-xs text-red-400">
            Insufficient balance. You have {parseFloat(currentBalance).toFixed(4)} {isHypeVault ? 'HYPE' : selectedStablecoin}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleDeposit}
          disabled={isPending || hasInsufficientBalance}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#50e2c3] text-black font-medium rounded-lg hover:bg-[#3fcbac] transition-colors disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {depositState.status === 'confirming' ? 'Confirm in wallet...' : 'Processing...'}
            </>
          ) : (
            'Confirm Deposit'
          )}
        </button>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function LastAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeDepositId, setActiveDepositId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { address, isConnected, hypeBalance, usdcBalance, usdt0Balance } = useChatDeposit();
  
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
      const walletContext = isConnected && address ? {
        address,
        hypeBalance,
        usdcBalance,
        usdt0Balance,
      } : undefined;
      
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          walletContext,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get response');
      
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          action: data.action,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        if (data.action?.type === 'deposit_action') {
          setActiveDepositId(assistantMessage.id);
        }
      } else {
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

  const handleDepositComplete = () => {
    const successMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: '✅ Deposit completed! You can view your updated positions on the Dashboard.',
    };
    setMessages(prev => [...prev, successMessage]);
    setActiveDepositId(null);
  };

  const handleDepositCancel = () => {
    const cancelMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: "No problem! Let me know if you'd like to deposit later or have questions about the vaults.",
    };
    setMessages(prev => [...prev, cancelMessage]);
    setActiveDepositId(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const clearChat = () => {
    setMessages([]);
    setActiveDepositId(null);
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

  const suggestions = [
    "Deposit 10 HYPE into Kinetiq",
    "What are the yield vault options?",
    "What's happening with HypurrFi?",
    "Latest announcements from partners",
  ];

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
            <p className="text-xs text-zinc-500">Intelligence + Actions</p>
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
              I can make deposits, synthesize protocol updates, and answer DeFi questions.
            </p>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
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
            {message.role === 'assistant' && activeDepositId === message.id && message.action ? (
              <DepositCard
                action={message.action}
                onComplete={handleDepositComplete}
                onCancel={handleDepositCancel}
              />
            ) : (
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-[#50e2c3] text-black'
                    : 'bg-white/[0.05] text-white'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            )}
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
            placeholder="Ask about protocols or deposit into vaults..."
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
