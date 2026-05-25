'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Hourglass, ShieldAlert, BadgeCheck, XSquare, Zap } from 'lucide-react';

interface CheckoutPanelProps {
  selectedSeats: string[]; // e.g. ["C14", "C15"]
  bookingReferences: Record<string, string>; // seatNumber -> UUID
  onAuthorizePayment: (refs: string[]) => Promise<void>;
  onSimulateReversal: (refs: string[]) => Promise<void>;
  onTimeout: () => void;
  onLogMessage: (type: 'INGRESS' | 'SYSTEM' | 'ERROR' | 'SUCCESS' | 'CONFLICT', message: string) => void;
}

export default function CheckoutPanel({
  selectedSeats,
  bookingReferences,
  onAuthorizePayment,
  onSimulateReversal,
  onTimeout,
  onLogMessage,
}: CheckoutPanelProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(300); // 5 minutes
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevSeatsLength = useRef<number>(selectedSeats.length);
  
  // Track selectedSeats to reset timer when a seat is added to the cart
  useEffect(() => {
    if (selectedSeats.length > 0) {
      // Only reset the timer if a new seat was added (not if one was removed)
      if (selectedSeats.length > prevSeatsLength.current) {
        setSecondsLeft(300);
        setIsExpired(false);
        setIsSubmitting(false);
        const newlyAdded = selectedSeats[selectedSeats.length - 1];
        onLogMessage('SYSTEM', `LEASES BUNDLED: Attached Seat ${newlyAdded} to checkout cart. Lease timer extended to 300s.`);
      }
      prevSeatsLength.current = selectedSeats.length;
    }
  }, [selectedSeats, onLogMessage]);

  useEffect(() => {
    if (isExpired || selectedSeats.length === 0) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsExpired(true);
          onLogMessage('ERROR', `LEASE EXPIRED: Checkout lease for seats [${selectedSeats.join(', ')}] exceeded 300s TTL threshold.`);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, isExpired, selectedSeats, onTimeout, onLogMessage]);

  const handleAuthorize = async () => {
    if (isSubmitting || isExpired || selectedSeats.length === 0) return;
    setIsSubmitting(true);
    
    const refs = selectedSeats.map(seat => bookingReferences[seat]).filter(Boolean);
    onLogMessage('INGRESS', `DISPATCHING TRANSACTIONS: Settling payment for ${refs.length} lease references in parallel...`);
    
    try {
      await onAuthorizePayment(refs);
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReversal = async () => {
    if (isSubmitting || isExpired || selectedSeats.length === 0) return;
    setIsSubmitting(true);
    
    const refs = selectedSeats.map(seat => bookingReferences[seat]).filter(Boolean);
    onLogMessage('INGRESS', `DISPATCHING BATCH REVERSAL: Simulating failed token releases for ${refs.length} references...`);
    
    try {
      await onSimulateReversal(refs);
    } catch {
      // Handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for quick developer evaluation - jumps timer to 10 seconds
  const accelerateTimer = () => {
    if (secondsLeft > 10) {
      setSecondsLeft(10);
      onLogMessage('SYSTEM', `DEV OVERRIDE: Accelerated active basket lease countdown to 10 seconds for eviction testing.`);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (secondsLeft / 300) * 100;
  const isUrgent = secondsLeft < 60;

  return (
    <div className={`border bg-[#050505] p-5 flex flex-col justify-between h-full select-none transition-all ${
      isExpired 
        ? 'border-red-600 animate-pulse' 
        : isUrgent 
          ? 'border-red-500' 
          : 'border-neutral-800'
    }`}>
      <div className="space-y-6">
        {/* Header and Countdown */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            TRANSACTION_LEASE_MONITOR
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={accelerateTimer}
              className="text-[9px] border border-neutral-800 hover:border-amber-500 bg-black text-neutral-500 hover:text-amber-500 px-1 py-0.5 font-bold transition-colors flex items-center gap-1"
              title="Fast-forward timer to 10 seconds for timeout testing"
              disabled={isExpired || secondsLeft <= 10 || selectedSeats.length === 0}
            >
              <Zap className="w-2.5 h-2.5" /> Fast
            </button>
            <Hourglass className={`w-3.5 h-3.5 text-neutral-400 ${isUrgent && 'animate-spin text-red-500'}`} />
          </div>
        </div>

        {/* Big Brutalist Timer Display */}
        <div className="bg-[#0c0c0c] border border-neutral-900 p-4 text-center">
          <p className="text-[10px] text-neutral-600 tracking-wider uppercase mb-1">
            CART BUNDLE LEASE VALIDITY
          </p>
          <div 
            className={`font-mono text-4xl font-extrabold tracking-widest ${
              isExpired 
                ? 'text-red-500 line-through' 
                : isUrgent 
                  ? 'text-red-500 animate-pulse-fast' 
                  : 'text-amber-500'
            }`}
          >
            {formatTime(secondsLeft)}
          </div>

          {/* Lease Progress Bar */}
          <div className="w-full bg-neutral-950 border border-neutral-900 h-2 mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                isUrgent ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {isExpired && (
            <div className="mt-3 flex items-center justify-center gap-2 text-red-500 text-[10px] uppercase font-bold tracking-widest animate-pulse-fast">
              <ShieldAlert className="w-3 h-3" />
              LEASE EXPIRED - ALL BUNDLE SLOTS RESET
            </div>
          )}
        </div>

        {/* Data Manifest Sheet */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
            LEASE DATA BUNDLE MANIFEST ({selectedSeats.length} SEAT{selectedSeats.length > 1 ? 'S' : ''})
          </p>
          
          <div className="border border-neutral-900 max-h-[160px] overflow-y-auto divide-y divide-neutral-900 text-[11px] font-mono">
            {selectedSeats.map(seat => {
              const ref = bookingReferences[seat];
              return (
                <div key={seat} className="flex flex-col p-2 bg-[#0a0a0a]">
                  <div className="flex justify-between font-bold text-white mb-0.5">
                    <span>SEAT {seat}:</span>
                    <span className="text-[9.5px] font-normal text-amber-500">PENDING_CONFIRMATION</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-neutral-500">
                    <span>REF:</span>
                    <span className="select-all text-neutral-300 font-mono">
                      {ref ? `${ref.substring(0, 16)}...` : 'WAITING_HANDSHAKE'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-2 mt-6">
        <button
          onClick={handleAuthorize}
          disabled={isSubmitting || isExpired || selectedSeats.length === 0}
          className={`w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-xs tracking-widest py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none`}
        >
          <BadgeCheck className="w-4 h-4 stroke-[2.5]" />
          AUTHORIZE BATCH SETTLEMENT
        </button>
        
        <button
          onClick={handleReversal}
          disabled={isSubmitting || isExpired || selectedSeats.length === 0}
          className={`w-full border border-red-500/50 hover:border-red-500 text-red-500 hover:bg-red-500/10 font-bold text-xs tracking-widest py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none`}
        >
          <XSquare className="w-4 h-4" />
          SIMULATE BATCH REVERSAL
        </button>
        
        <p className="text-[9px] text-neutral-600 text-center uppercase tracking-wider select-none">
          SECURE PAYMENTS ROUTED TO WEBHOCK TERMINAL v2
        </p>
      </div>
    </div>
  );
}
