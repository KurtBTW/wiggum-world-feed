'use client';

import { useState } from 'react';
import { Loader2, Phone, Key, Lock, CheckCircle } from 'lucide-react';

interface TelegramAuthProps {
  onAuthenticated: () => void;
}

export function TelegramAuth({ onAuthenticated }: TelegramAuthProps) {
  const [step, setStep] = useState<'phone' | 'code' | 'password' | 'success'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/telegram/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendCode', phoneNumber }),
      });

      const data = await res.json();

      if (data.success) {
        setPhoneCodeHash(data.phoneCodeHash);
        setStep('code');
      } else {
        setError(data.error || 'Failed to send code');
      }
    } catch (e) {
      setError('Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/telegram/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'signIn',
          phoneNumber,
          phoneCode,
          phoneCodeHash,
          password: password || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStep('success');
        setTimeout(onAuthenticated, 1500);
      } else if (data.needsPassword) {
        setStep('password');
      } else {
        setError(data.error || 'Failed to sign in');
      }
    } catch (e) {
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Connected!</h3>
        <p className="text-zinc-400">Your Telegram is now linked.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-[#0088cc]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-[#0088cc]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white">Connect Telegram</h2>
        <p className="text-sm text-zinc-400 mt-1">One-time setup to link your account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#0088cc]/50"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          <button
            onClick={handleSendCode}
            disabled={!phoneNumber || loading}
            className="w-full py-3 bg-[#0088cc] text-white font-medium rounded-lg hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Code'}
          </button>
        </div>
      )}

      {step === 'code' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Verification Code
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                placeholder="12345"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#0088cc]/50"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Check your Telegram app for the code</p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={!phoneCode || loading}
            className="w-full py-3 bg-[#0088cc] text-white font-medium rounded-lg hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
          </button>
        </div>
      )}

      {step === 'password' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Two-Factor Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your 2FA password"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#0088cc]/50"
              />
            </div>
          </div>

          <button
            onClick={handleSignIn}
            disabled={!password || loading}
            className="w-full py-3 bg-[#0088cc] text-white font-medium rounded-lg hover:bg-[#0088cc]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </div>
      )}
    </div>
  );
}
