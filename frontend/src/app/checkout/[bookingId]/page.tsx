"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Lock, Info, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const SEAT_PRICE = 150.0;
const FEE_PERCENT = 0.05;

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId
    ? decodeURIComponent(params.bookingId as string)
    : "";

  const { activeAllocation, addLog, authToken, clearActiveAllocation } =
    useApp();

  const [timeLeft, setTimeLeft] = useState(449); // 7 mins 29 secs
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "CARD" | "UPI" | "NET_BANKING" | "WALLETS"
  >("CARD");
  const [upiOptionSelected, setUpiOptionSelected] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>("Shvet Ghare");
  const [emailAddress, setEmailAddress] = useState<string>("shvet@example.com");
  const [eventMeta, setEventMeta] = useState<{title?: string, venue?: string, city?: string, image?: string, date?: string, time?: string} | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let email = localStorage.getItem("userEmail");
      let name = localStorage.getItem("userName");

      const token = authToken || localStorage.getItem("authToken");

      if (token) {
        try {
          if (token.startsWith("simulated-token-") || token.startsWith("google-token-")) {
            const base64Part = token.split("-").pop() || "";
            const decodedEmail = window.atob(base64Part);
            if (decodedEmail && decodedEmail.includes("@")) {
              email = decodedEmail;
            }
          } else {
            // Real JWT token
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            if (payload && payload.email) {
              email = payload.email;
            }
          }
        } catch (e) {
          console.error("Failed to decode token for email", e);
        }
      }

      if (email) {
        setEmailAddress(email);
        if (!name) {
          const prefix = email.split("@")[0];
          name = prefix
            .split(/[._-]/)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ");
        }
      }

      if (name) {
        setFullName(name);
      }

      try {
        const storedEvent = sessionStorage.getItem("currentEvent");
        if (storedEvent) {
          setEventMeta(JSON.parse(storedEvent));
        }
      } catch (e) {
        console.error("Failed to load event meta from session", e);
      }
    }
  }, [authToken]);

  // bookingId from URL may be comma-joined for multi-seat bookings (e.g. "uuid1,uuid2")
  // The primary ID (first) is used for the confirmation page URL
  const primaryBookingId = bookingId ? bookingId.split(",")[0] : "";

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

  const selectedSeatsList =
    activeAllocation?.seatLabels ||
    (activeAllocation?.seatLabel
      ? [activeAllocation.seatLabel]
      : ["A12", "A13"]);

  const subtotal = selectedSeatsList.length * SEAT_PRICE;
  const fee = subtotal * FEE_PERCENT;
  const total = subtotal + fee;

  const isSubmitDisabled =
    activeTab !== "UPI" || !upiOptionSelected || isProcessing;

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    setIsProcessing(true);
    addLog(
      "INGRESS",
      `PAYMENT INTENT: Contacting Razorpay billing gateway for booking reference(s) ${bookingId.split(",").length}...`,
    );

    try {
      // 1. Post to Payment Order Initialization Endpoint
      const response = await fetch(
        `http://localhost:8080/api/v1/payments/order/${encodeURIComponent(bookingId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Outbound order request failed");
      }

      const orderData = await response.json();
      addLog(
        "SUCCESS",
        `ORDER CREATED: Order ID: ${orderData.razorpayOrderId}. Instantiating payment overlay.`,
      );

      // 2. Standard Razorpay Script Injection & Loading
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("Failed to load Razorpay checkout script"));
          document.body.appendChild(script);
        });
      }

      // 3. Open Razorpay Checkout Window
      const options = {
        key: orderData.razorpayKeyId || "rzp_test_RX2NsQZbugMgmp",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "TICKETFLOW SEATING",
        description: `Secure Reservation: Seat ${selectedSeatsList.join(", ")}`,
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: "shvet@example.com",
          contact: "",
        },
        theme: {
          color: "#0052CC",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            addLog(
              "INFO",
              "PAYMENT DISMISSED: Checkout window closed by client.",
            );
          },
        },
        handler: async function (paymentResponse: any) {
          setIsProcessing(true);
          addLog(
            "SUCCESS",
            `TRANSACTION CAPTURED: Payment confirmed. Txn ID: ${paymentResponse.razorpay_payment_id}`,
          );
          addLog(
            "SYSTEM",
            "LOCAL LOOPBACK: Directing settlement trigger to local server...",
          );

          try {
            const settleRes = await fetch(
              `http://localhost:8080/api/v1/payments/settle/${encodeURIComponent(bookingId)}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken
                    ? { Authorization: `Bearer ${authToken}` }
                    : {}),
                },
              },
            );

            if (settleRes.ok) {
              addLog(
                "SUCCESS",
                `SETTLEMENT RESOLVED: Payment confirmed. Redirecting to booking confirmation...`,
              );
              router.push(`/booking/${encodeURIComponent(bookingId)}/confirmation`);
            } else {
              throw new Error("Direct settlement dispatch failed");
            }
          } catch (err) {
            addLog("ERROR", "Direct settlement dispatch failed.");
            setIsProcessing(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      setIsProcessing(false);
      addLog(
        "ERROR",
        "PAYMENT ERROR: Outbound payment routing failed or checkout script unreachable.",
      );
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans ${jakarta.className}`}
    >
      {/* SECURE NAVBAR */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-blue-900">
          <div className="w-3 h-3 bg-blue-600"></div>
          Ticketizer
        </div>

        <div className="flex items-center gap-2 text-gray-600">
          <Lock size={14} />
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase">
            Secure Checkout
          </span>
        </div>

        <Link
          href="/events"
          className="text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 tracking-wider uppercase transition-colors"
        >
          Cancel
        </Link>
      </nav>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8 lg:py-10">
        {/* PROGRESS INDICATOR */}
        <div className="flex w-full mb-8 lg:mb-12">
          <div className="flex-1 border-t-2 border-blue-600 pt-3 relative">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-blue-600 uppercase">
              1. Select Seats
            </span>
          </div>
          <div className="flex-1 border-t-2 border-blue-600 pt-3 relative">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-blue-600 uppercase">
              2. Review & Pay
            </span>
          </div>
          <div className="flex-1 border-t-2 border-gray-200 pt-3 relative">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider text-gray-400 uppercase">
              3. Confirmation
            </span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">
          Review & Pay
        </h1>

        <form
          onSubmit={handlePaymentSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* LEFT COLUMN: FORMS (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* EVENT & SEAT SUMMARY CARD */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">LIVE VENUE BOOKING</h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Ticketizer Unified Seating Cluster
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    Order Reference: #
                    {primaryBookingId
                      ? primaryBookingId.substring(0, 8).toUpperCase()
                      : "TKZ-TEMP"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="text-[10px] font-bold tracking-widest text-blue-600 uppercase hover:underline"
                >
                  Edit Seats
                </button>
              </div>

              <div className="w-full bg-[#F8F9FA] rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100/50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        Seat
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                        Tier
                      </th>
                      <th className="px-4 py-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase text-right">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSeatsList.map((seat) => (
                      <tr key={seat}>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {seat}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Standard
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-gray-900 text-right">
                          ${SEAT_PRICE.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CONTACT INFORMATION CARD */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-5">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-2">
                  Phone Number
                </label>
                <div className="flex border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent overflow-hidden transition-all">
                  <div className="bg-gray-50 px-4 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                    +91
                  </div>
                  <input
                    type="tel"
                    required
                    defaultValue=""
                    className="w-full px-4 py-3 text-sm font-medium outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PAYMENT METHOD CARD */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-5">
                Payment Method
              </h3>

              {/* Payment Tabs */}
              <div className="flex bg-[#F0F4F8] p-1 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("CARD");
                    setUpiOptionSelected(false);
                  }}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === "CARD"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("UPI")}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === "UPI"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("NET_BANKING");
                    setUpiOptionSelected(false);
                  }}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all hidden sm:block ${
                    activeTab === "NET_BANKING"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Net Banking
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("WALLETS");
                    setUpiOptionSelected(false);
                  }}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    activeTab === "WALLETS"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Wallets
                </button>
              </div>

              {/* Conditional Form Render based on Active Tab */}
              {activeTab === "UPI" ? (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                    Select UPI Provider
                  </p>
                  <div
                    onClick={() => setUpiOptionSelected(!upiOptionSelected)}
                    className={`border-2 rounded-xl p-5 flex items-center justify-between cursor-pointer transition-all ${
                      upiOptionSelected
                        ? "border-blue-600 bg-blue-50/20"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          upiOptionSelected
                            ? "border-blue-600 bg-blue-600/10"
                            : "border-gray-300"
                        }`}
                      >
                        {upiOptionSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Razorpay Secure UPI Gateway
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          Instant Auto-settlement & Dynamic QR Issuance
                        </p>
                      </div>
                    </div>
                    <div className="bg-[#1F2937] text-white text-[9px] font-extrabold tracking-widest px-2.5 py-1 rounded">
                      RAZORPAY
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800 text-xs font-semibold leading-relaxed flex items-start gap-3">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-extrabold uppercase mb-1">
                      Method Temporarily Unavailable
                    </h4>
                    <p className="font-medium">
                      Card, Net Banking, and Wallets are future add-on channels.
                      Please use the UPI (Razorpay) payment method to secure
                      your dynamic seats instantly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Global TOS Consent */}
            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                required
                defaultChecked
                id="tos"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer mt-0.5"
              />
              <label
                htmlFor="tos"
                className="text-xs font-medium text-gray-600 cursor-pointer leading-relaxed"
              >
                I agree to the{" "}
                <Link href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and acknowledge that tickets for high-demand simulated events
                are non-refundable once confirmed.
              </label>
            </div>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY (4 cols, Sticky) */}
          <div className="lg:col-span-4 relative">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-24">
              <h3 className="text-[11px] font-bold tracking-widest text-gray-500 uppercase mb-5">
                Order Summary
              </h3>

              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden mb-4 relative">
                  <img
                    src={eventMeta?.image || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400"}
                    alt={eventMeta?.title || "Stadium"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                  {eventMeta?.title || "Live Event Reservation"}
                </h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {eventMeta?.venue || "Standard Seat Locks"}{eventMeta?.city ? ` (${eventMeta.city})` : ""}<br />
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{eventMeta?.date || ""} • {eventMeta?.time || ""}</span>
                </p>
              </div>

              <div className="space-y-3 mb-6 border-b border-gray-200 pb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">
                    {selectedSeatsList.length} Seats (
                    {selectedSeatsList.join(", ")})
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 font-medium">
                    Convenience Fee (5%)
                  </span>
                  <span className="font-mono font-bold text-gray-900">
                    ${fee.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="bg-[#EBF3FF] rounded-lg p-4 flex justify-between items-center mb-6 border border-blue-100">
                <span className="text-xs font-bold tracking-widest text-blue-900 uppercase">
                  Total Amount
                </span>
                <span className="text-2xl font-black text-blue-700">
                  ${total.toFixed(2)}
                </span>
              </div>

              <div className="bg-[#FFF4E5] border border-[#FFE0B2] text-[#E65100] rounded-lg py-3 px-4 text-center text-xs font-medium mb-4">
                Complete payment in{" "}
                <span className="font-bold font-mono tracking-wide">
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="w-full flex items-center justify-center gap-2 bg-[#0D6EFD] text-white py-4 rounded-lg font-bold tracking-wide hover:bg-blue-700 transition-colors shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isProcessing
                  ? "Processing..."
                  : `Confirm & Pay $${total.toFixed(2)}`}{" "}
                <ArrowRight size={18} />
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-gray-400">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  256-bit SSL encrypted
                </span>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="font-extrabold text-lg text-blue-900 mb-1 tracking-tight">
              Ticketizer
            </h2>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
              © 2024 Ticketizer. Seats don&apos;t wait.
            </p>
          </div>

          <div className="flex gap-6 text-[11px] font-bold tracking-widest text-gray-500 uppercase">
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Help
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              About
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
