"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Clock, ArrowRight, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const COLS = Array.from({ length: 20 }, (_, i) => i + 1);
const SEAT_PRICE = 150.0;
const FEE_PERCENT = 0.05;

export default function SeatSelectionPage() {
  const params = useParams();
  const router = useRouter();
  const showId = params?.showId ? Number(params.showId) : 1;

  const {
    seats,
    selectSeat,
    activeAllocation,
    syncLiveInventory,
    addLog,
    authToken,
    currentShowId,
    setCurrentShowId,
  } = useApp();


  const [timeLeft, setTimeLeft] = useState(585); // 09:45 in seconds

  useEffect(() => {
    // If not authenticated, prompt log
    if (!authToken) {
      addLog("ERROR", "SECURE SHIELD ACTIVE: Please sign in or register to select seats.");
    }

    // Sync showId from URL into AppContext if different
    if (showId !== currentShowId) {
      setCurrentShowId(showId);
    } else {
      // Sync seat status from relational + cache engine
      syncLiveInventory(true);
    }

    // Set up real-time inventory sync intervals
    const intervalId = setInterval(() => {
      syncLiveInventory(false);
    }, 4000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId]);


  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleSeatClick = async (seatLabel: string) => {
    if (!authToken) {
      alert("Please sign in or register to purchase and select seats.");
      router.push("/auth/login");
      return;
    }
    
    const targetSeat = seats[seatLabel];
    if (!targetSeat) return;

    if (targetSeat.status === "BOOKED" || (targetSeat.status === "LOCKED" && !activeAllocation?.seatLabels?.includes(seatLabel))) {
      return;
    }

    await selectSeat(seatLabel);
  };

  // Extract selected seat labels
  const selectedSeatsList = activeAllocation?.seatLabels || [];
  
  // Financial calculations
  const subtotal = selectedSeatsList.length * SEAT_PRICE;
  const fee = subtotal * FEE_PERCENT;
  const total = subtotal + fee;

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8F9FB] text-gray-900 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-8 lg:gap-12">
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-blue-900"
          >
            <div className="w-3 h-3 bg-blue-600"></div>
            Ticketizer
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
            <Link
              href="/events"
              className="hover:text-gray-900 transition-colors"
            >
              Events
            </Link>
            <Link
              href="/my-bookings"
              className="text-blue-600 border-b-2 border-blue-600 pb-1"
            >
              My Bookings
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          {authToken ? (
            <div className="flex items-center gap-2 bg-[#F1F3F5] px-3 py-1.5 rounded border border-gray-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">
                AUTHENTICATED
              </span>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden sm:block text-sm font-semibold hover:text-blue-600 transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={() => router.push("/auth/register")}
                className="bg-blue-600 text-white px-4 py-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-bold rounded hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-6 lg:py-10">
        {/* EVENT HEADER & TIMER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#D3E2FF] text-blue-800 text-[10px] font-extrabold tracking-widest px-2.5 py-1 rounded uppercase">
                Live Event
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                LIVE VENUE SEATING LAYOUT
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium mt-2">
              Secured Connection • Madision Square Garden & Wankhede Stadium Simulation
            </p>
          </div>

          <div className="bg-[#F0F4F8] border border-blue-200 rounded-lg px-5 py-3 flex flex-col items-center min-w-[140px]">
            <span className="text-[9px] font-bold tracking-widest text-gray-500 uppercase mb-1">
              Session Expires In
            </span>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-xl font-mono tracking-wider">
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex bg-[#F0F4F8] rounded-xl overflow-hidden mb-8 border border-gray-200">
          <div className="flex-1 bg-[#0D6EFD] text-white py-4 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase">
              <span className="opacity-70 mr-1 sm:mr-2 font-mono">01</span>{" "}
              Select Seats
            </span>
          </div>
          <div className="flex-1 py-4 flex items-center justify-center border-r border-gray-200/50">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-gray-400">
              <span className="opacity-50 mr-1 sm:mr-2 font-mono">02</span>{" "}
              Checkout
            </span>
          </div>
          <div className="flex-1 py-4 flex items-center justify-center">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-gray-400">
              <span className="opacity-50 mr-1 sm:mr-2 font-mono">03</span>{" "}
              Confirmation
            </span>
          </div>
        </div>

        {/* 12-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: SEAT MAP CONTAINER (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-4 sm:p-8 shadow-sm flex flex-col min-h-[600px]">
            {/* Stage Area */}
            <div className="w-full bg-[#F0F4F8] border border-gray-200 rounded-lg py-6 sm:py-8 flex items-center justify-center mb-10">
              <span className="text-xs sm:text-sm font-bold tracking-widest text-gray-500 uppercase">
                Pitch / Stage
              </span>
            </div>

            {/* Interactive Grid */}
            <div className="flex-1 overflow-x-auto pb-8 no-scrollbar">
              <div className="min-w-[600px] flex flex-col items-center mx-auto">
                {/* Column Numbers */}
                <div className="flex mb-4 pl-8 gap-1.5 sm:gap-2">
                  {COLS.map((col) => (
                    <div
                      key={`col-${col}`}
                      className="w-6 sm:w-7 text-center text-[9px] font-bold text-gray-400"
                    >
                      {col}
                    </div>
                  ))}
                </div>

                {/* Rows Grid */}
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  {ROWS.map((row) => (
                    <div
                      key={`row-${row}`}
                      className="flex items-center gap-1.5 sm:gap-2"
                    >
                      <div className="w-6 text-[10px] font-bold text-gray-400 text-right pr-2">
                        {row}
                      </div>
                      {COLS.map((col) => {
                        const seatId = `${row}${col}`;
                        const seat = seats[seatId];
                        
                        const isLocked = seat?.status === "LOCKED" && !selectedSeatsList.includes(seatId);
                        const isBooked = seat?.status === "BOOKED";
                        const isSelected = selectedSeatsList.includes(seatId);

                        let seatStyles =
                          "bg-white border-gray-300 hover:border-blue-500 cursor-pointer";
                        if (isSelected)
                          seatStyles =
                            "bg-[#0D6EFD] border-[#0D6EFD] shadow-[0_0_8px_rgba(13,110,253,0.4)] z-10 scale-110";
                        if (isLocked)
                          seatStyles =
                            "bg-amber-300 border-amber-300 cursor-not-allowed opacity-75";
                        if (isBooked)
                          seatStyles =
                            "bg-gray-100 border-gray-200 cursor-not-allowed relative overflow-hidden";

                        return (
                          <div
                            key={seatId}
                            onClick={() => handleSeatClick(seatId)}
                            className={`w-6 h-6 sm:w-7 sm:h-7 border rounded-[3px] transition-all duration-200 flex items-center justify-center group ${seatStyles}`}
                          >
                            {isBooked && (
                              <svg
                                className="w-4 h-4 text-gray-300 absolute"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center sm:justify-between items-center gap-4 pt-6 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-[2px]"></div>
                <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-[#0D6EFD] rounded-[2px]"></div>
                <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Selected
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-300 rounded-[2px] opacity-75"></div>
                <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Locked
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded-[2px] flex items-center justify-center">
                  <X size={10} className="text-gray-300" />
                </div>
                <span className="text-[10px] font-bold tracking-widest text-gray-600 uppercase">
                  Booked
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (4 cols, Sticky) */}
          <div className="lg:col-span-4 flex flex-col gap-6 relative">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                YOUR SELECTION
              </h2>
              <p className="text-xs text-gray-500 font-medium mb-6">
                Seats are held for 10 minutes
              </p>

              {/* Selected Seats List */}
              <div className="min-h-[120px] mb-6">
                {selectedSeatsList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm font-medium italic">
                    No seats selected
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 no-scrollbar">
                    {selectedSeatsList.map((seat) => (
                      <div
                        key={seat}
                        className="flex justify-between items-center bg-[#F8F9FB] p-3 rounded-lg border border-gray-100"
                      >
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            Seat {seat}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                            Standard Tier
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-blue-700">
                            ${SEAT_PRICE.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleSeatClick(seat)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="border-t border-gray-200 pt-6 space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold tracking-widest text-gray-600 uppercase text-[11px]">
                    Subtotal
                  </span>
                  <span className="font-mono font-medium text-gray-600">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold tracking-widest text-gray-600 uppercase text-[11px]">
                    Fee (5%)
                  </span>
                  <span className="font-mono font-medium text-gray-600">
                    ${fee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#F0F4F8] rounded-xl p-5 flex justify-between items-center mb-6 border border-gray-200">
                <span className="text-lg font-extrabold tracking-tight text-gray-900">
                  TOTAL
                </span>
                <span className="text-2xl font-black text-[#0D6EFD] font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>

              {activeAllocation && activeAllocation.bookingId ? (
                <button
                  onClick={() => {
                    // URL-encode the comma-joined booking IDs for safe routing
                    const encodedId = encodeURIComponent(activeAllocation.bookingId);
                    router.push(`/checkout/${encodedId}`);
                  }}
                  className="w-full py-4 bg-[#0D6EFD] text-white hover:bg-blue-700 cursor-pointer rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-none"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>
              )}
            </div>

            {/* Trust Badge */}
            <div className="bg-[#F0F4F8] border border-blue-100 rounded-xl p-5 flex items-start gap-4 shadow-sm lg:sticky lg:top-[500px]">
              <ShieldCheck size={24} className="text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-1">
                  Secure Ticketing
                </h4>
                <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                  Ticketizer ensures authentic tickets with dynamic QR
                  technology. Resale restricted to official marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}
