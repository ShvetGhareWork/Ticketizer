'use client';

import React, { useState } from 'react';
import { Terminal, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function LoginPortal() {
  const { login } = useApp();
  const [email, setEmail] = useState<string>('user@ticketflow.com');
  const [password, setPassword] = useState<string>('password123');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const success = await login(email, password);
    if (!success) {
      setErrorMsg('SECURE GATEWAY HANDSHAKE REFUSED. VERIFY EMAIL AND PASSWORD.');
      setIsSubmitting(false);
    }
  };

  const injectEmail = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setPassword('password123');
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] p-4 select-none">
      <div className="max-w-md w-full border-2 border-white bg-black p-6 md:p-8 select-text">
        {/* Brand Header */}
        <div className="flex items-center gap-3 border-b-2 border-white pb-6 mb-6">
          <div className="bg-white text-black p-2 flex items-center justify-center">
            <KeyRound className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-widest text-white uppercase">
              Sign In to Your Account
            </h1>
            <p className="text-[10px] text-neutral-500 tracking-wider">
              TICKETFLOW // TICKET BOOKING GATEWAY
            </p>
          </div>
        </div>

        {/* Informative Alert */}
        <div className="border border-neutral-800 bg-[#0c0c0c] p-4 text-[10px] uppercase leading-5 text-neutral-400 font-mono mb-6">
          <span className="font-extrabold text-[#d97706] block mb-1">
            ▲ SEAT RESERVATION SYSTEM
          </span>
          Welcome! Sign in using your email address and password below to unlock real-time seating layouts and book your tickets.
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-2">
              YOUR EMAIL ADDRESS:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full bg-[#121212] border border-neutral-800 focus:border-white focus:outline-none text-white px-3 py-3 font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
              placeholder="Enter your email address"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-2">
              YOUR PASSWORD:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full bg-[#121212] border border-neutral-800 focus:border-white focus:outline-none text-white px-3 py-3 font-mono text-xs tracking-wider transition-colors disabled:opacity-50"
              placeholder="Enter your password"
            />
          </div>

          {errorMsg && (
            <div className="border border-red-500 bg-red-950/20 text-red-500 p-3 text-[10px] uppercase font-bold flex items-start gap-2 leading-4 animate-pulse">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !email || !password}
            className="w-full bg-white hover:bg-neutral-200 text-black font-extrabold text-xs tracking-widest py-4 transition-colors flex items-center justify-center gap-2 uppercase disabled:opacity-40 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                SIGNING YOU IN...
              </>
            ) : (
              'CONTINUE TO SEATS'
            )}
          </button>
        </form>

        {/* Preflight quick injection */}
        <div className="mt-8 border-t border-neutral-900 pt-6">
          <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-3">
            QUICK ONE-CLICK SIGN IN OPTIONS:
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => injectEmail('user@ticketflow.com')}
              disabled={isSubmitting}
              className="w-full border border-neutral-800 hover:border-neutral-400 bg-[#0c0c0c] hover:bg-black text-[10px] text-neutral-400 hover:text-white px-3 py-2 font-mono uppercase text-left transition-all flex justify-between"
            >
              <span>INJECT TEST USER</span>
              <span className="text-neutral-600 font-bold">user@ticketflow.com</span>
            </button>
            <button
              onClick={() => injectEmail('admin@ticketflow.com')}
              disabled={isSubmitting}
              className="w-full border border-neutral-800 hover:border-neutral-400 bg-[#0c0c0c] hover:bg-black text-[10px] text-neutral-400 hover:text-white px-3 py-2 font-mono uppercase text-left transition-all flex justify-between"
            >
              <span>INJECT TEST ADMIN</span>
              <span className="text-neutral-600 font-bold">admin@ticketflow.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
