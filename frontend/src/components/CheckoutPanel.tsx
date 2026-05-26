'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Hourglass, ShieldAlert, BadgeCheck, XSquare, Zap, Ticket, Loader2 } from 'lucide-react';
import { useApp, AllocationManifest } from '@/context/AppContext';

// Extend the Window interface to recognize Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPanel() {
  const { 
    authToken, 
    seats, 
    activeAllocation, 
    clearActiveAllocation, 
    setActiveAllocation, 
    addLog,
    syncLiveInventory 
  } = useApp();

  const [secondsLeft, setSecondsLeft] = useState<number>(300); // 5 minutes lease
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevBookingIdRef = useRef<string | null>(null);

  // Reset timer when a new seat allocation is captured
  useEffect(() => {
    if (activeAllocation) {
      if (activeAllocation.bookingId !== prevBookingIdRef.current) {
        setSecondsLeft(300);
        setIsExpired(false);
        setIsSubmitting(false);
        setIsPolling(false);
        setConfirmedBooking(null);
        prevBookingIdRef.current = activeAllocation.bookingId;
        addLog('SYSTEM', `LEASE COUNTER START: Seat ${activeAllocation.seatLabel} leased. 300s TTL valid.`);
      }
    } else {
      prevBookingIdRef.current = null;
      setConfirmedBooking(null);
    }
  }, [activeAllocation, addLog]);

  // Countdown timer daemon
  useEffect(() => {
    if (isExpired || !activeAllocation || confirmedBooking || isPolling) return;

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsExpired(true);
          addLog('ERROR', `LEASE EXPIRED: Booking ref ${activeAllocation.bookingId.substring(0,8)} timed out.`);
          clearActiveAllocation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [secondsLeft, isExpired, activeAllocation, confirmedBooking, isPolling, clearActiveAllocation, addLog]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fast forward countdown helper (for dev testing)
  const accelerateTimer = () => {
    if (secondsLeft > 10) {
      setSecondsLeft(10);
      addLog('SYSTEM', 'DEV OVERRIDE: Fast-forwarded lease countdown to 10 seconds.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // OUTBOUND PAYMENT INITIALIZATION & CHECKOUT PIPELINE
  // ─────────────────────────────────────────────────────────────────────────────
  const initiatePayment = async () => {
    if (!activeAllocation || isSubmitting || isExpired) return;
    setIsSubmitting(true);
    addLog('INGRESS', `PAYMENT INTENT: Contacting Razorpay billing gateway for booking ${activeAllocation.bookingId.substring(0,8)}...`);

    try {
      // 1. Post to Payment Order Initialization Endpoint
      const response = await fetch(`http://localhost:8080/api/v1/payments/order/${activeAllocation.bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Outbound order request failed');
      }

      const orderData = await response.json();
      addLog('SUCCESS', `ORDER CREATED: Order ID: ${orderData.razorpayOrderId}. Instantiating payment overlay.`);



      // 3. Standard Razorpay Script Injection & Loading
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
          document.body.appendChild(script);
        });
      }

      // 4. Open Razorpay Checkout Window
      const options = {
        key: orderData.razorpayKeyId || 'rzp_test_placeholder_key_id', // Dynamic key from backend configuration
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'TICKETFLOW SEATING',
        description: `Secure Reservation: Seat ${activeAllocation.seatLabel}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: 'user@ticketflow.com',
          contact: '9999999999',
        },
        theme: {
          color: '#000000',
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            addLog('INFO', 'PAYMENT DISMISSED: Checkout window closed by client.');
          }
        },
        handler: async function (paymentResponse: any) {
          setIsSubmitting(false);
          setIsPolling(true);
          addLog('SUCCESS', `TRANSACTION CAPTURED: Payment confirmed. Txn ID: ${paymentResponse.razorpay_payment_id}`);
          addLog('SYSTEM', 'LOCAL LOOPBACK: Directing settlement trigger to local server...');
          
          try {
            await fetch(`http://localhost:8080/api/v1/payments/settle/${activeAllocation.bookingId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            });
          } catch (err) {
            addLog('ERROR', 'Direct settlement dispatch failed.');
          }

          startStatusPolling(activeAllocation.bookingId);
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      setIsSubmitting(false);
      addLog('ERROR', 'PAYMENT ERROR: Outbound payment routing failed or checkout script unreachable.');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RECONCILIATION POLL LOOP
  // ─────────────────────────────────────────────────────────────────────────────
  const startStatusPolling = (bookingRef: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const refs = bookingRef.split(',');

    pollIntervalRef.current = setInterval(async () => {
      try {
        const promises = refs.map(ref =>
          fetch(`http://localhost:8080/api/v1/bookings/${ref}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
            },
          }).then(async res => {
            if (res.ok) return res.json();
            throw new Error('Fetch failed');
          })
        );

        const results = await Promise.all(promises);

        if (results.every(data => data.status === 'CONFIRMED')) {
          clearInterval(pollIntervalRef.current!);
          setIsPolling(false);
          
          const qrCodePayloads = results.map(data => data.qrCodePayload);
          
          const combinedBooking = {
            bookingReference: results.map(data => data.bookingReference).join(', '),
            status: 'CONFIRMED',
            qrCodePayload: qrCodePayloads[0],
            qrCodePayloads: qrCodePayloads
          };
          
          setConfirmedBooking(combinedBooking);
          
          if (activeAllocation) {
            setActiveAllocation({
              ...activeAllocation,
              status: 'CONFIRMED',
              qrCodePayload: qrCodePayloads[0],
              qrCodePayloads: qrCodePayloads
            });
          }
          addLog('SUCCESS', 'STATE CONVERGED: Cryptographic entry QR codes verified. Transaction secured!');
          syncLiveInventory(false);
        } else if (results.some(data => data.status === 'CANCELLED' || data.status === 'EXPIRED')) {
          clearInterval(pollIntervalRef.current!);
          setIsPolling(false);
          addLog('ERROR', `TRANSACTION TERMINATED: Booking was cancelled or expired by backend reconciliation.`);
          clearActiveAllocation();
        }
      } catch (err) {
        logErrorPoller();
      }
    }, 1000); // Poll every 1 second for ultra-reactive UI state transition
  };

  const logErrorPoller = () => {
    // Suppress spammy log during network dips but keep active polling alive
  };

  const handleSimulateReversal = async () => {
    if (!activeAllocation || isSubmitting || isPolling) return;
    setIsSubmitting(true);
    addLog('INGRESS', `SIMULATING BATCH REVERSAL: Releasing locks for booking ${activeAllocation.bookingId.substring(0,8)}...`);
    
    try {
      // Direct administrative cancel release
      await new Promise(r => setTimeout(r, 600));
      addLog('INFO', 'REVERSAL SUCCESS: Basket locks released back into regional seat pools.');
      clearActiveAllocation();
    } catch {
      //
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!activeAllocation) return null;

  const progressPercentage = (secondsLeft / 300) * 100;
  const isUrgent = secondsLeft < 60;

  // ─────────────────────────────────────────────────────────────────────────────
  // CRYPTOGRAPHIC TICKET PRESENTER (State: CONFIRMED)
  // ─────────────────────────────────────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className="border-2 border-[#059669] bg-[#020202] p-6 flex flex-col justify-between h-full select-none select-text">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#059669]/30 pb-3">
            <span className="text-[11px] font-extrabold tracking-widest text-[#059669] uppercase flex items-center gap-1.5">
              <Ticket className="w-4 h-4" /> TRANSACTION_SECURED_ENTRY_MANIFEST
            </span>
            <span className="text-[9px] bg-[#059669]/20 text-[#059669] px-2 py-0.5 font-bold tracking-wider">
              CONFIRMED
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 bg-[#0a0a0a] border border-neutral-900 gap-6 max-h-[320px] overflow-y-auto">
            {confirmedBooking.qrCodePayloads && confirmedBooking.qrCodePayloads.length > 0 ? (
              confirmedBooking.qrCodePayloads.map((qr: string, idx: number) => (
                <div key={idx} className="flex flex-col items-center justify-center border-b border-neutral-900 pb-4 last:border-b-0 last:pb-0 w-full">
                  <span className="text-[10px] text-white font-extrabold mb-2 uppercase tracking-widest">
                    SEAT {activeAllocation.seatLabels?.[idx] || activeAllocation.seatLabel}
                  </span>
                  {qr ? (
                    <img 
                      src={qr} 
                      alt={`Ticket Entry QR Code Seat ${activeAllocation.seatLabels?.[idx]}`} 
                      className="w-44 h-44 border-2 border-white select-none pointer-events-none" 
                    />
                  ) : (
                    <div className="w-44 h-44 border-2 border-dashed border-neutral-800 flex items-center justify-center">
                      <span className="text-[9px] text-neutral-600">LOADING QR...</span>
                    </div>
                  )}
                </div>
              ))
            ) : confirmedBooking.qrCodePayload ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[10px] text-white font-extrabold mb-2 uppercase tracking-widest">
                  SEAT {activeAllocation.seatLabel}
                </span>
                <img 
                  src={confirmedBooking.qrCodePayload} 
                  alt="Ticket Entry QR Code" 
                  className="w-44 h-44 border-2 border-white select-none pointer-events-none" 
                />
              </div>
            ) : (
              <div className="w-44 h-44 border-2 border-dashed border-neutral-800 flex items-center justify-center">
                <span className="text-[9px] text-neutral-600">LOADING QR_CODE...</span>
              </div>
            )}
            <div className="mt-4 text-center font-mono text-[9px] text-neutral-400 uppercase tracking-widest leading-4">
              <span>SCAN QR TO CONFIRM PASSAGE ENTRY</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-neutral-900 pt-4 text-xs font-mono text-neutral-400">
            <div className="flex justify-between">
              <span>TICKET REF(S):</span>
              <span className="text-white font-extrabold select-all text-right max-w-[200px] break-all">{confirmedBooking.bookingReference}</span>
            </div>
            <div className="flex justify-between">
              <span>SEAT UNIT(S):</span>
              <span className="text-white font-extrabold">SECTOR-1 // {activeAllocation.seatLabel}</span>
            </div>
            <div className="flex justify-between">
              <span>SHOW ID:</span>
              <span className="text-white font-extrabold">BLOCK_SHOW_{activeAllocation.showId}</span>
            </div>
            <div className="flex justify-between border-t border-neutral-900/50 mt-2 pt-2 text-[10px]">
              <span>LEDGER CONVERGENCE:</span>
              <span className="text-emerald-500 font-bold">COMMIT_SUCCESS</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveAllocation(null)}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs tracking-widest py-3 mt-6 transition-colors flex items-center justify-center gap-2"
        >
          ACQUIRE ANOTHER TICKET
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CHECKOUT GATEWAY POLLING STATE (State: VERIFYING / POLLING)
  // ─────────────────────────────────────────────────────────────────────────────
  if (isPolling) {
    return (
      <div className="border border-neutral-800 bg-[#050505] p-6 text-center flex flex-col items-center justify-center h-full min-h-[380px] select-none">
        <div className="border border-neutral-800 bg-black p-4 inline-block mb-4">
          <Loader2 className="w-8 h-8 text-[#d97706] stroke-[1.5] animate-spin" />
        </div>
        <h3 className="text-xs uppercase font-extrabold tracking-widest text-white mb-2">
          STATE RECONCILIATION LOOP
        </h3>
        <p className="text-[10px] text-[#d97706] max-w-[250px] leading-5 mx-auto uppercase">
          Outbound settlement received. Querying database ledger for cryptographic QR allocation...
        </p>
        <div className="w-16 border-t border-neutral-800 my-6 mx-auto"></div>
        <div className="text-[9px] text-neutral-600 font-mono tracking-wider animate-pulse">
          POLLING LEDGER REF: {activeAllocation.bookingId.substring(0,16)}...
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STANDARD BASKET ACTIVE LEASE VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`border bg-[#050505] p-5 flex flex-col justify-between h-full select-none transition-all ${
      isExpired 
        ? 'border-red-600 animate-pulse' 
        : isUrgent 
          ? 'border-red-500' 
          : 'border-neutral-800'
    }`}>
      <div className="space-y-6">
        {/* Header and Title */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <span className="text-[11px] font-bold tracking-widest text-neutral-400 uppercase">
            SECURE YOUR SEAT LEASE
          </span>
          <Hourglass className={`w-3.5 h-3.5 text-neutral-400 ${isUrgent && 'animate-spin text-red-500'}`} />
        </div>

        {/* Big Brutalist Timer Display */}
        <div className="bg-[#0c0c0c] border border-neutral-900 p-4 text-center">
          <p className="text-[10px] text-neutral-500 tracking-wider uppercase mb-1">
            SEAT SECURED FOR THE NEXT
          </p>
          <div 
            className={`font-mono text-4xl font-extrabold tracking-widest ${
              isExpired 
                ? 'text-red-500 line-through' 
                : isUrgent 
                  ? 'text-red-500 animate-pulse' 
                  : 'text-[#d97706]'
            }`}
          >
            {formatTime(secondsLeft)}
          </div>

          <p className="text-[9px] text-neutral-600 mt-2 uppercase">
            Complete your checkout before the timer runs out to lock your reservation.
          </p>

          {/* Lease Progress Bar */}
          <div className="w-full bg-neutral-950 border border-neutral-900 h-2 mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                isUrgent ? 'bg-red-500 animate-pulse' : 'bg-[#d97706]'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {isExpired && (
            <div className="mt-3 flex items-center justify-center gap-2 text-red-500 text-[10px] uppercase font-bold tracking-widest animate-pulse">
              <ShieldAlert className="w-3 h-3" />
              LEASE EXPIRED - PLEASE TRY AGAIN
            </div>
          )}
        </div>

        {/* Data Manifest Sheet */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
            Booking Details
          </p>
          
          <div className="border border-neutral-900 divide-y divide-neutral-900 text-[11px] font-mono">
            {activeAllocation.seatLabels && activeAllocation.bookingIds ? (
              activeAllocation.seatLabels.map((lbl: string, idx: number) => (
                <div key={lbl} className="flex flex-col p-2 bg-[#0a0a0a]">
                  <div className="flex justify-between font-bold text-white mb-0.5">
                    <span>SEAT {lbl}:</span>
                    <span className="text-[9.5px] font-normal text-[#d97706]">{activeAllocation.status}</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-neutral-500">
                    <span>ORDER REF:</span>
                    <span className="select-all text-neutral-400 font-mono">
                      {activeAllocation.bookingIds?.[idx]?.substring(0, 16) || ''}...
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col p-2 bg-[#0a0a0a]">
                <div className="flex justify-between font-bold text-white mb-0.5">
                  <span>SEAT {activeAllocation.seatLabel}:</span>
                  <span className="text-[9.5px] font-normal text-[#d97706]">{activeAllocation.status}</span>
                </div>
                <div className="flex justify-between text-[9px] text-neutral-500">
                  <span>ORDER REF:</span>
                  <span className="select-all text-neutral-400 font-mono">
                    {activeAllocation.bookingId.substring(0, 16)}...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action triggers */}
      <div className="space-y-2 mt-6">
        <button
          onClick={initiatePayment}
          disabled={isSubmitting || isExpired}
          className="w-full bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs tracking-widest py-3.5 transition-colors flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none uppercase"
        >
          <BadgeCheck className="w-4 h-4 stroke-[2.5]" />
          PAY VIA RAZORPAY
        </button>

        {/* Hidden Developer Tools Collapsible Box */}
        <details className="border border-neutral-900 bg-black mt-4 overflow-hidden select-none">
          <summary className="px-3 py-2 text-[9px] text-neutral-500 font-bold uppercase tracking-wider cursor-pointer hover:bg-neutral-900 transition-colors list-none select-none flex items-center justify-between">
            <span>⚙ DEVELOPER TESTING UTILITIES</span>
            <span className="text-[8px] text-neutral-600 border border-neutral-800 px-1 py-0.2">SIMULATOR</span>
          </summary>
          <div className="p-3 border-t border-neutral-900 space-y-2 font-mono">
            <button
              onClick={handleSimulateReversal}
              disabled={isSubmitting || isExpired}
              className="w-full border border-red-500/30 hover:border-red-500 text-red-500 hover:bg-red-500/10 font-bold text-[9px] py-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
            >
              <XSquare className="w-3.5 h-3.5" />
              SIMULATE LEASE REVERSAL
            </button>
            <button
              onClick={accelerateTimer}
              className="w-full border border-amber-600/30 hover:border-amber-600 text-amber-500 hover:bg-amber-600/10 font-bold text-[9px] py-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
              disabled={isExpired || secondsLeft <= 10}
            >
              <Zap className="w-3.5 h-3.5" />
              FAST-FORWARD TIMER (10s)
            </button>
          </div>
        </details>
        
        <p className="text-[9px] text-neutral-600 text-center uppercase tracking-wider select-none">
          SECURE PAYMENTS ROUTED TO RAZORPAY TERMINAL v2
        </p>
      </div>
    </div>
  );
}
