'use client';

import React from 'react';
import Header from '@/components/Header';
import SeatMap from '@/components/SeatMap';
import CheckoutPanel from '@/components/CheckoutPanel';
import SystemConsole from '@/components/SystemConsole';
import LoginPortal from '@/components/LoginPortal';
import { Layers, Database, ShieldAlert } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function TicketFlowDashboard() {
  const { 
    authToken,
    currentShowId,
    setCurrentShowId,
    isRefreshing,
    syncLiveInventory,
    flushDatabase,
    activeAllocation
  } = useApp();

  // Component A: Stateless Auth Guard Interceptor
  if (!authToken) {
    return (
      <div className="flex flex-col flex-1 gap-4 md:gap-6 lg:gap-8">
        <Header />
        <LoginPortal />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 gap-4 md:gap-6 lg:gap-8">
      {/* Real-time Gateway Diagnostics Header */}
      <Header />

      {/* Guided Booking Progress Steps */}
      <div className="border border-neutral-800 bg-[#050505] p-4 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-extrabold font-mono">
              BOOKING PROGRESSION:
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs font-mono">
            {/* Step 1 */}
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-black font-extrabold text-[10px]">
                1
              </span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                SIGN IN ✓
              </span>
            </div>

            <span className="text-neutral-800 hidden sm:inline">──</span>

            {/* Step 2 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 flex items-center justify-center font-extrabold text-[10px] ${
                activeAllocation 
                  ? 'bg-emerald-500 text-black' 
                  : 'bg-white text-black animate-pulse'
              }`}>
                2
              </span>
              <span className={`uppercase tracking-wider text-[10px] font-bold ${
                activeAllocation 
                  ? 'text-emerald-400' 
                  : 'text-white'
              }`}>
                CHOOSE SEAT
              </span>
            </div>

            <span className="text-neutral-800 hidden sm:inline">──</span>

            {/* Step 3 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 flex items-center justify-center font-extrabold text-[10px] ${
                activeAllocation && activeAllocation.status === 'CONFIRMED'
                  ? 'bg-emerald-500 text-black'
                  : activeAllocation
                    ? 'bg-[#d97706] text-black animate-pulse'
                    : 'bg-neutral-900 text-neutral-600'
              }`}>
                3
              </span>
              <span className={`uppercase tracking-wider text-[10px] font-bold ${
                activeAllocation && activeAllocation.status === 'CONFIRMED'
                  ? 'text-emerald-400'
                  : activeAllocation
                    ? 'text-[#d97706]'
                    : 'text-neutral-600'
              }`}>
                PAYMENT (RAZORPAY)
              </span>
            </div>

            <span className="text-neutral-800 hidden sm:inline">──</span>

            {/* Step 4 */}
            <div className="flex items-center gap-1.5">
              <span className={`w-5 h-5 flex items-center justify-center font-extrabold text-[10px] ${
                activeAllocation && activeAllocation.status === 'CONFIRMED'
                  ? 'bg-emerald-500 text-black animate-pulse'
                  : 'bg-neutral-900 text-neutral-600'
              }`}>
                4
              </span>
              <span className={`uppercase tracking-wider text-[10px] font-bold ${
                activeAllocation && activeAllocation.status === 'CONFIRMED'
                  ? 'text-emerald-400'
                  : 'text-neutral-600'
              }`}>
                ENTRY TICKET QR
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Structural Matrix Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 flex-1 items-start">
        
        {/* Left Column: Seating Grid Layout Area (Cols 1 to 8) */}
        <div className="lg:col-span-8 flex flex-col h-full gap-4">
          
          {/* Seating Header & Admin Operations Control Board */}
          <div className="border border-neutral-800 bg-[#050505] p-3 flex flex-wrap items-center justify-between gap-4 select-none">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d97706]" />
              <span className="text-xs uppercase font-extrabold tracking-wider text-white">
                AUDITORIUM SEATING MATRIX // SECTOR-1
              </span>
            </div>

            {/* Ingress Controls & Sync/Flush Utilities */}
            <div className="flex items-center gap-4 text-[10px] text-neutral-400 font-mono">
              {/* Show Switch Dropdown Selector */}
              <div className="flex items-center gap-1.5 border border-neutral-800 bg-black px-2 py-0.5">
                <span className="text-neutral-600 font-bold">SELECT_SHOW:</span>
                <select
                  value={currentShowId}
                  onChange={(e) => setCurrentShowId(Number(e.target.value))}
                  disabled={activeAllocation !== null && activeAllocation.status === 'VERIFYING'}
                  className="bg-black text-white border-none focus:outline-none font-mono font-extrabold text-[10px] uppercase cursor-pointer"
                >
                  <option value={1}>SHOW 1 // 18:00 UTC</option>
                  <option value={2}>SHOW 2 // 21:30 UTC</option>
                </select>
              </div>

              {/* Force Hydrate Sync */}
              <button
                onClick={() => syncLiveInventory(true)}
                disabled={isRefreshing}
                className="px-2 py-0.5 border border-neutral-800 hover:border-white bg-black text-neutral-400 hover:text-white transition-all font-bold uppercase flex items-center gap-1 disabled:opacity-50"
              >
                <Database className={`w-3 h-3 ${isRefreshing && 'animate-spin'}`} />
                Sync
              </button>

              {/* Administrative DB Flush */}
              <button
                onClick={flushDatabase}
                className="px-3 py-0.5 border border-red-800/80 bg-red-950/30 text-red-400 hover:bg-red-900/40 hover:border-red-500 transition-all font-extrabold uppercase flex items-center gap-1"
                title="Wipe database bookings table and restore 200 AVAILABLE seats in PostgreSQL and Redis sets"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Flush DB
              </button>
            </div>
          </div>

          {/* Seat Grid Map */}
          <SeatMap />
        </div>

        {/* Right Column: Checkout Manifest Panels & Logging Daemon Console (Cols 9 to 12) */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full justify-between">
          
          {/* Checkout Panel Zone */}
          <div className="flex-1 min-h-[360px]">
            {activeAllocation ? (
              <CheckoutPanel />
            ) : (
              /* Brutalist Idle Mode Card */
              <div className="border border-neutral-800 bg-[#050505] p-6 text-center flex flex-col items-center justify-center h-full min-h-[380px] select-none">
                <div className="border border-neutral-800 bg-black p-4 inline-block mb-4">
                  <Database className="w-8 h-8 text-neutral-500 stroke-[1.5] animate-pulse" />
                </div>
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-white mb-2">
                  TRANSACTIONAL CORE STANDBY
                </h3>
                <p className="text-[10px] text-neutral-500 max-w-[240px] leading-5 mx-auto uppercase">
                  Gateway idle. Click one or more available seat Nodes from the
                  grid to allocate locks into the basket.
                </p>
                <div className="w-16 border-t border-neutral-800 my-6 mx-auto"></div>
                <div className="text-[9px] text-neutral-600 font-mono tracking-wider">
                  LISTENING FOR TRANSACTION INGRESS_
                </div>
              </div>
            )}
          </div>

          {/* System Diagnostics Ingress Log */}
          <div>
            <SystemConsole />
          </div>
        </div>
      </div>
    </div>
  );
}
