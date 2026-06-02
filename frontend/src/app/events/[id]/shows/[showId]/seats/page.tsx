"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  X,
  Accessibility,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

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
    currentEventId,
    setCurrentShowId,
    isVerified,
    verifyOtp,
    resendOtp,
  } = useApp();

  const [eventMeta, setEventMeta] = useState<{
    title?: string;
    venue?: string;
    city?: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  // OTP Verification States
  const [otpCode, setOtpCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [activeMethod, setActiveMethod] = useState<string>("EMAIL");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {
        const stored = sessionStorage.getItem("currentEvent");
        if (stored) {
          setEventMeta(JSON.parse(stored));
        }
        const savedMethod = localStorage.getItem("verificationMethod");
        if (savedMethod) {
          setActiveMethod(savedMethod);
        }
      } catch (e) {
        console.error("Failed to parse currentEvent or verificationMethod", e);
      }
    }
  }, [authToken, isVerified]);

  const seatList = Object.values(seats);

  const venue = eventMeta?.venue || "";
  const lowerVenue = venue.toLowerCase();
  const title = eventMeta?.title || "";
  const lowerTitle = title.toLowerCase();

  const isSphere = lowerVenue.includes("sphere");
  const isStadium =
    lowerVenue.includes("sofi") ||
    lowerVenue.includes("stadium") ||
    lowerVenue.includes("field") ||
    lowerVenue.includes("modi") ||
    lowerVenue.includes("wankhede") ||
    lowerTitle.includes("world cup");
  const isTheater =
    lowerVenue.includes("theater") ||
    lowerVenue.includes("comedy") ||
    lowerVenue.includes("club");

  const ROWS =
    seatList.length > 0
      ? Array.from(new Set(seatList.map((s) => s.row))).sort()
      : isSphere
        ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
        : isStadium
          ? [
              "A",
              "B",
              "C",
              "D",
              "E",
              "F",
              "G",
              "H",
              "I",
              "J",
              "K",
              "L",
              "M",
              "N",
            ]
          : isTheater
            ? ["A", "B", "C", "D", "E", "F"]
            : showId === 1
              ? [
                  "A",
                  "B",
                  "C",
                  "D",
                  "E",
                  "F",
                  "G",
                  "H",
                  "I",
                  "J",
                  "K",
                  "L",
                  "M",
                  "N",
                ]
              : showId === 2
                ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]
                : ["A", "B", "C", "D", "E", "F"];

  const COLS =
    seatList.length > 0
      ? Array.from(new Set(seatList.map((s) => s.number))).sort((a, b) => a - b)
      : isSphere
        ? Array.from({ length: 15 }, (_, i) => i + 1)
        : isStadium
          ? Array.from({ length: 24 }, (_, i) => i + 1)
          : isTheater
            ? Array.from({ length: 12 }, (_, i) => i + 1)
            : showId === 1
              ? Array.from({ length: 24 }, (_, i) => i + 1)
              : showId === 2
                ? Array.from({ length: 15 }, (_, i) => i + 1)
                : Array.from({ length: 12 }, (_, i) => i + 1);

  const getSeatPriceAndTier = (seatId: string) => {
    if (!seatId) return { price: 80.0, tier: "Standard Tier" };
    const row = seatId.charAt(0);
    const col = parseInt(seatId.slice(1), 10);

    if (isSphere) {
      const isPremium =
        ["A", "B", "C", "D", "E"].includes(row) && col >= 6 && col <= 10;
      return isPremium
        ? { price: 500.0, tier: "Premium Recliner" }
        : { price: 250.0, tier: "Standard Tier" };
    } else if (isStadium) {
      const isPremium = ["A", "B", "C"].includes(row) && col >= 8 && col <= 17;
      return isPremium
        ? { price: 350.0, tier: "VIP Club Tier" }
        : { price: 150.0, tier: "Standard Tier" };
    } else {
      const isPremium = ["A", "B"].includes(row) && col >= 5 && col <= 8;
      return isPremium
        ? { price: 150.0, tier: "Front Row VIP" }
        : { price: 80.0, tier: "Standard Tier" };
    }
  };

  const venueName = venue
    ? `${venue} (${isSphere ? "Immersive Sphere Layout" : isStadium ? "Grand Stadium Layout" : "Intimate Layout"})`
    : showId === 1
      ? "Narendra Modi Stadium (Grand Stadium Layout)"
      : showId === 2
        ? "Las Vegas Sphere (Immersive Sphere Layout)"
        : "Comedy Club Theater (Intimate Layout)";

  const [timeLeft, setTimeLeft] = useState(585);

  useEffect(() => {
    if (!authToken) {
      addLog(
        "ERROR",
        "SECURE SHIELD ACTIVE: Please sign in or register to select seats.",
      );
    }

    const eventId = params?.id as string;

    if (showId !== currentShowId || eventId !== currentEventId) {
      setCurrentShowId(showId, eventId);
    } else {
      syncLiveInventory(true);
    }

    const intervalId = setInterval(() => {
      syncLiveInventory(false);
    }, 4000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showId, params?.id, currentShowId, currentEventId]);

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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setVerificationError("Please enter a valid 6-digit code.");
      return;
    }
    setVerificationError(null);
    const success = await verifyOtp(otpCode);
    if (!success) {
      setVerificationError("Incorrect or expired OTP. Please try again.");
    } else {
      setOtpCode("");
    }
  };

  const handleResend = async (methodOverride?: string) => {
    setResending(true);
    setVerificationError(null);
    const targetMethod = methodOverride || activeMethod;
    const success = await resendOtp(targetMethod);
    setResending(false);
    if (success) {
      if (methodOverride) {
        setActiveMethod(methodOverride);
      }
      alert(`A new 6-digit verification code has been dispatched via ${targetMethod}.`);
    } else {
      setVerificationError("Failed to resend verification code.");
    }
  };

  const handleSeatClick = async (seatLabel: string) => {
    if (!authToken) {
      alert("Please sign in or register to purchase and select seats.");
      router.push("/auth/login");
      return;
    }

    const targetSeat = seats[seatLabel];
    if (!targetSeat) return;

    if (
      targetSeat.status === "BOOKED" ||
      (targetSeat.status === "LOCKED" &&
        !activeAllocation?.seatLabels?.includes(seatLabel))
    ) {
      return;
    }

    await selectSeat(seatLabel);
  };

  const selectedSeatsList = activeAllocation?.seatLabels || [];
  const subtotal = selectedSeatsList.reduce(
    (sum, seatId) => sum + getSeatPriceAndTier(seatId).price,
    0,
  );
  const fee = subtotal * FEE_PERCENT;
  const total = subtotal + fee;

  const handleCheckout = () => {
    if (activeAllocation && activeAllocation.bookingId) {
      const encodedId = encodeURIComponent(activeAllocation.bookingId);
      router.push(`/checkout/${encodedId}`);
    }
  };

  if (!mounted) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] text-gray-900 ${jakarta.className}`}
      >
        <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 tracking-widest uppercase">
          Initializing Dynamic Venue Map...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8F9FB] text-gray-900 ${jakarta.className} relative pb-20 lg:pb-0`}
    >
      <Header />

      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-6 lg:py-10">
        {/* EVENT HEADER & TIMER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <span className="bg-[#D3E2FF] text-blue-800 text-[9px] sm:text-[10px] font-extrabold tracking-widest px-2.5 py-1 rounded uppercase">
                Live Event
              </span>
              <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                LIVE VENUE SEATING
              </h1>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium mt-1 sm:mt-2">
              Secured Connection • {venueName}
            </p>
          </div>

          <div className="bg-[#F0F4F8] border border-blue-200 rounded-lg px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col items-center w-full sm:w-auto sm:min-w-[140px]">
            <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-500 uppercase mb-1">
              Session Expires In
            </span>
            <div className="flex items-center gap-2 text-blue-700 font-bold text-lg sm:text-xl font-mono tracking-wider">
              <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex bg-[#F0F4F8] rounded-xl overflow-hidden mb-6 sm:mb-8 border border-gray-200">
          <div className="flex-1 bg-[#0D6EFD] text-white py-3 sm:py-4 flex items-center justify-center px-2">
            <span className="text-[9px] sm:text-xs lg:text-sm font-bold tracking-widest uppercase truncate">
              <span className="opacity-70 mr-1 sm:mr-2 font-mono">01</span>{" "}
              Select Seats
            </span>
          </div>
          <div className="flex-1 py-3 sm:py-4 flex items-center justify-center border-r border-gray-200/50 px-2">
            <span className="text-[9px] sm:text-xs lg:text-sm font-bold tracking-widest uppercase text-gray-400 truncate">
              <span className="opacity-50 mr-1 sm:mr-2 font-mono">02</span>{" "}
              Checkout
            </span>
          </div>
          <div className="flex-1 py-3 sm:py-4 flex items-center justify-center px-2">
            <span className="text-[9px] sm:text-xs lg:text-sm font-bold tracking-widest uppercase text-gray-400 truncate">
              <span className="opacity-50 mr-1 sm:mr-2 font-mono">03</span>{" "}
              Confirm
            </span>
          </div>
        </div>

        {/* 12-COLUMN MAIN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT: SEAT MAP CONTAINER (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm flex flex-col min-h-[500px] lg:min-h-[600px]">
            {/* Stage Area */}
            <div className="w-full bg-[#F0F4F8] border border-gray-200 rounded-lg py-4 sm:py-6 lg:py-8 flex items-center justify-center mb-8 sm:mb-12 lg:mb-16">
              <span className="text-[10px] sm:text-xs lg:text-sm font-bold tracking-widest text-gray-500 uppercase">
                Pitch / Stage Area
              </span>
            </div>

            {/* Interactive Grid - Fluid Touch Scrolling Enabled */}
            <div className="flex-1 overflow-x-auto pb-8 sm:pb-12 touch-pan-x touch-pan-y no-scrollbar">
              <div className="min-w-[580px] lg:min-w-fit flex flex-col items-center mx-auto px-2">
                {/* Column Numbers */}
                <div className="flex mb-4 sm:mb-6 pl-6 sm:pl-8 gap-1.5 sm:gap-2">
                  {COLS.map((col) => {
                    const isAisleCol =
                      (isSphere && (col === 5 || col === 11)) ||
                      (isStadium && (col === 7 || col === 18)) ||
                      (isTheater && (col === 4 || col === 9));
                    if (isAisleCol) {
                      return (
                        <div
                          key={`col-aisle-${col}`}
                          className="w-5 sm:w-6 lg:w-7 text-center opacity-0 pointer-events-none"
                        />
                      );
                    }
                    return (
                      <div
                        key={`col-${col}`}
                        className="w-5 sm:w-6 lg:w-7 text-center text-[8px] sm:text-[9px] font-bold text-gray-400"
                      >
                        {col}
                      </div>
                    );
                  })}
                </div>

                {/* Rows Grid */}
                <div className="flex flex-col gap-2.5 sm:gap-3">
                  {ROWS.map((row) => {
                    const isAisleRow = isStadium && row === "G";
                    if (isAisleRow) {
                      return (
                        <div
                          key={`row-aisle-${row}`}
                          className="h-5 sm:h-6 flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-gray-300 tracking-widest uppercase border-y border-dashed border-gray-100 my-1 w-full bg-gray-50/50"
                        >
                          CROSS WALKWAY AISLE
                        </div>
                      );
                    }

                    return (
                      <div
                        key={`row-${row}`}
                        className="flex items-center gap-1.5 sm:gap-2"
                      >
                        <div className="w-6 text-[9px] sm:text-[10px] font-bold text-gray-400 text-right pr-2 flex-shrink-0">
                          {row}
                        </div>
                        {COLS.map((col) => {
                          const seatId = `${row}${col}`;
                          const seat = seats[seatId];

                          const isAisle =
                            (isSphere && (col === 5 || col === 11)) ||
                            (isStadium && (col === 7 || col === 18)) ||
                            (isTheater && (col === 4 || col === 9));

                          if (isAisle) {
                            return (
                              <div
                                key={`aisle-${row}-${col}`}
                                className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 opacity-0 pointer-events-none flex-shrink-0"
                              />
                            );
                          }

                          const isLocked =
                            seat?.status === "LOCKED" &&
                            !selectedSeatsList.includes(seatId);
                          const isBooked = seat?.status === "BOOKED";
                          const isSelected = selectedSeatsList.includes(seatId);

                          const isWheelchair =
                            (isSphere && row === "L" && col >= 7 && col <= 9) ||
                            (isStadium &&
                              row === "N" &&
                              [1, 2, 23, 24].includes(col)) ||
                            (isTheater &&
                              row === "F" &&
                              (col === 1 || col === 12));

                          const isPremium =
                            (isSphere &&
                              ["A", "B", "C", "D", "E"].includes(row) &&
                              col >= 6 &&
                              col <= 10) ||
                            (isStadium &&
                              ["A", "B", "C"].includes(row) &&
                              col >= 8 &&
                              col <= 17) ||
                            (isTheater &&
                              ["A", "B"].includes(row) &&
                              col >= 5 &&
                              col <= 8);

                          let seatStyles =
                            "bg-white border-gray-300 hover:border-blue-500 lg:hover:scale-105 cursor-pointer text-gray-400";

                          if (isPremium) {
                            seatStyles =
                              "bg-amber-50 border-amber-400 hover:border-amber-500 hover:bg-amber-100 lg:hover:scale-105 cursor-pointer text-amber-600 shadow-[0_1px_2px_rgba(245,158,11,0.08)]";
                          }
                          if (isWheelchair) {
                            seatStyles =
                              "bg-sky-50 border-sky-300 hover:border-sky-500 hover:bg-sky-100 lg:hover:scale-105 cursor-pointer text-sky-600 shadow-[0_1px_2px_rgba(14,165,233,0.08)]";
                          }
                          if (isSelected) {
                            seatStyles =
                              "bg-[#0D6EFD] border-[#0D6EFD] shadow-[0_0_8px_rgba(13,110,253,0.4)] z-10 scale-110 text-white cursor-pointer";
                          }
                          if (isLocked) {
                            seatStyles =
                              "bg-amber-300 border-amber-300 cursor-not-allowed opacity-75 text-amber-900";
                          }
                          if (isBooked) {
                            seatStyles =
                              "bg-gray-100 border-gray-200 cursor-not-allowed relative overflow-hidden text-gray-300";
                          }

                          let seatTransform = undefined;
                          if (isSphere) {
                            const colDiff = col - 8;
                            const sphereOffsetY = colDiff * colDiff * 1.6;
                            const sphereRotate = colDiff * 2.2;
                            seatTransform = {
                              transform: `translateY(${sphereOffsetY}px) rotate(${sphereRotate}deg)`,
                            };
                          }

                          return (
                            <div
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              style={seatTransform}
                              className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border rounded-[4px] sm:rounded-md transition-all duration-200 flex items-center justify-center group flex-shrink-0 ${seatStyles}`}
                              title={`Seat ${seatId} (${isPremium ? "Premium" : isWheelchair ? "Wheelchair" : "Standard"})`}
                            >
                              {isBooked ? (
                                <svg
                                  className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-300 absolute"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                >
                                  <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                              ) : isSelected ? (
                                <span className="text-[7px] sm:text-[8px] font-extrabold leading-none">
                                  {col}
                                </span>
                              ) : isPremium ? (
                                <Crown className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-500" />
                              ) : isWheelchair ? (
                                <Accessibility className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-sky-500" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center sm:justify-between items-center gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-100 mt-auto">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white border border-gray-300 rounded-[3px]"></div>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-600 uppercase">
                  Available
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-50 border border-amber-400 rounded-[3px] flex items-center justify-center">
                  <Crown className="w-2 h-2 text-amber-500" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-600 uppercase">
                  Premium
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-sky-50 border border-sky-300 rounded-[3px] flex items-center justify-center">
                  <Accessibility className="w-2 h-2 text-sky-500" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-600 uppercase">
                  Accessible
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#0D6EFD] rounded-[3px]"></div>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-600 uppercase">
                  Selected
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-100 border border-gray-200 rounded-[3px] flex items-center justify-center">
                  <X size={10} className="text-gray-300" />
                </div>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-600 uppercase">
                  Booked
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: ORDER SUMMARY (4 cols, Sticky) */}
          {/* RIGHT: ORDER SUMMARY (4 cols, Sticky Container) */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-extrabold text-gray-900 tracking-tight mb-1">
                YOUR SELECTION
              </h2>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-4 sm:mb-6">
                Seats are held for 10 minutes
              </p>

              {/* Selected Seats List */}
              <div className="min-h-[100px] sm:min-h-[120px] mb-4 sm:mb-6">
                {selectedSeatsList.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs sm:text-sm font-medium italic py-8">
                    No seats selected
                  </div>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3 max-h-[180px] sm:max-h-[200px] overflow-y-auto pr-2 no-scrollbar touch-pan-y">
                    {selectedSeatsList.map((seat) => {
                      const { price, tier } = getSeatPriceAndTier(seat);
                      return (
                        <div
                          key={seat}
                          className="flex justify-between items-center bg-[#F8F9FB] p-2.5 sm:p-3 rounded-lg border border-gray-100"
                        >
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-gray-900">
                              Seat {seat}
                            </p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              {tier}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-mono font-bold text-blue-700 text-sm sm:text-base">
                              ${price.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleSeatClick(seat)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1 -mr-1"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Calculations */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6 space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-bold tracking-widest text-gray-600 uppercase text-[10px] sm:text-[11px]">
                    Subtotal
                  </span>
                  <span className="font-mono font-medium text-gray-600">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="font-bold tracking-widest text-gray-600 uppercase text-[10px] sm:text-[11px]">
                    Fee (5%)
                  </span>
                  <span className="font-mono font-medium text-gray-600">
                    ${fee.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="bg-[#F0F4F8] rounded-xl p-4 sm:p-5 flex justify-between items-center mb-5 sm:mb-6 border border-gray-200">
                <span className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">
                  TOTAL
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0D6EFD] font-mono">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Desktop Checkout CTA */}
              <div className="hidden lg:block">
                {activeAllocation && activeAllocation.bookingId ? (
                  <button
                    onClick={handleCheckout}
                    className="w-full py-4 bg-[#0D6EFD] text-white hover:bg-blue-700 cursor-pointer rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md min-h-[48px]"
                  >
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 bg-gray-200 text-gray-400 cursor-not-allowed rounded-lg font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-none min-h-[48px]"
                  >
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Trust Badge */}
            <div className="bg-[#F0F4F8] border border-blue-100 rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm">
              <ShieldCheck
                size={20}
                className="sm:w-6 sm:h-6 text-blue-600 flex-shrink-0"
              />
              <div>
                <h4 className="text-[10px] sm:text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-1">
                  Secure Ticketing
                </h4>
                <p className="text-[9px] sm:text-[10px] text-gray-600 font-medium leading-relaxed">
                  Ticketizer ensures authentic tickets with dynamic QR
                  technology. Resale restricted to official marketplace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MOBILE STICKY BOTTOM CTA (Floating Action Bar) */}
      {selectedSeatsList.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 pb-6 sm:pb-4 shadow-[0_-8px_20px_-5px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="font-extrabold text-gray-900 text-base">
              Total:{" "}
              <span className="font-mono text-blue-700">
                ${total.toFixed(2)}
              </span>
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">
              {selectedSeatsList.length} Seat
              {selectedSeatsList.length > 1 ? "s" : ""} Selected
            </span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full py-3.5 bg-[#0D6EFD] text-white hover:bg-blue-700 cursor-pointer rounded-lg font-bold text-xs sm:text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-md min-h-[48px]"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* OTP VERIFICATION MODAL OVERLAY */}
      {authToken && !isVerified && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-200 shadow-2xl rounded-2xl p-6 sm:p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight">
              VERIFY YOUR ACCOUNT
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed font-medium">
              We sent a 6-digit verification code to lock inventory:
              <br />
              <span className="font-bold text-gray-800 break-all">
                {typeof window !== 'undefined' ? (activeMethod === "SMS" ? `+91 ${localStorage.getItem('userPhone')}` : localStorage.getItem('userEmail')) : ''}
              </span>
            </p>

            {verificationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold tracking-wide uppercase">
                {verificationError}
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <input
                maxLength={6}
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="0 0 0 0 0 0"
                className="text-2xl tracking-[12px] font-black text-center w-full py-3.5 border border-gray-300 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-gray-300 pl-[12px]"
                required
              />

              <button
                type="submit"
                className="w-full bg-[#0D6EFD] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 transition-colors shadow-md min-h-[48px] uppercase"
              >
                Verify OTP
              </button>

              <div className="flex bg-[#F0F4F8] p-1 rounded-lg mt-4">
                <button
                  type="button"
                  onClick={() => handleResend("EMAIL")}
                  disabled={resending}
                  className="flex-1 py-2 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all hover:bg-white/40 text-gray-600 disabled:opacity-50"
                >
                  Resend Email
                </button>
                {typeof window !== 'undefined' && localStorage.getItem('userPhone') && (
                  <button
                    type="button"
                    onClick={() => handleResend("SMS")}
                    disabled={resending}
                    className="flex-1 py-2 rounded text-[10px] font-extrabold uppercase tracking-wider transition-all hover:bg-white/40 text-gray-600 disabled:opacity-50"
                  >
                    Resend SMS
                  </button>
                )}
              </div>
              
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem("authToken");
                  localStorage.removeItem("isVerified");
                  window.location.reload();
                }}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest block mx-auto mt-2"
              >
                Sign out & cancel
              </button>
            </form>
          </div>
        </div>
      )}

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
