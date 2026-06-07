"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";
import { FileText, Shield, Clock, AlertTriangle } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function TermsOfServicePage() {
  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Banner Section */}
        <div className="mb-12 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <FileText size={14} />
              LEGAL DOCUMENT REGISTRY
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Last updated: June 7, 2026. Please read the core transaction rules, reservation lease terms, and acceptable usage policies.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> 1. OVERVIEW & CONTRACT TERMS
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Welcome to Ticketizer. By accessing or using our high-concurrency ticket reservation console, you agree to comply with and be bound by the following terms. This platform operates a high-frequency transactional bridge directly integrated with distributed inventory ledgers.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> 2. SEAT LOCK HOLD POLICIES & REDIS LEASES
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Ticketizer secures inventory using an in-memory lock engine. When you select a seat, a global lock lease is generated for exactly <strong>5 minutes (300 seconds)</strong>.
            </p>
            <ul className="list-disc pl-5 text-gray-500 text-xs font-medium space-y-2 leading-relaxed">
              <li>During this 300-second window, the seat is held exclusively for your session.</li>
              <li>If the checkout process is not completed within 300 seconds, the lock automatically expires and the seat is returned back to the available inventory pool immediately.</li>
              <li>Any attempts to bypass this timer or maintain stale locks artificially will result in session revocation.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} /> 3. TRANSACTION PERSISTENCE & FARES
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Fares and checkout prices are calculated in real-time. Because of transactional write-deferral pipelines (using message queue streaming), your booking goes into a <code>PENDING</code> status initially.
            </p>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Once the payment webhook iscryptographically signed and received, the booking state shifts to <code>CONFIRMED</code>. Cancelled bookings release the seat in real-time, restoring the seat back to Redis and Postgres dynamically.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> 4. ANTIBOT & SYSTEM INTEGRITY
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              To protect fair access to tickets, automated scraper scripts, headless browsers, or crawler traffic are strictly prohibited. We employ cryptographic signatures and session limits. Any violation triggers immediate client banning from our ticketing gateway.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
