"use client";

import React from "react";
import { Terminal, Shield, Activity, Cpu, Server } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function AboutPage() {
  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12">
        {/* Banner Section */}
        <div className="mb-12 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <Terminal size={14} className="animate-pulse" />
              SYSTEM MANIFESTO
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              The Booking Gateway.
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Ticketizer was built to solve transactional lock conflicts during viral, ultra-high-volume entertainment events.
            </p>
          </div>
        </div>

        {/* Narrative Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
              OUR MISSION & ARCHITECTURE
            </h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight leading-tight">
              Combating checkout queues, bots, and artificial limits since 2026.
            </h3>
            <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
              Modern ticket networks frequently collapse under high-concurrency demand. When tickets for legendary concerts go live, millions of bots and automated scalper programs spam API end-points to monopolize inventory, leading to crash-out sessions.
            </p>
            <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed">
              Ticketizer introduces an immutable, decentralized <strong>Transactional Lock Protocol (TLP)</strong>. By allocating immediate, isolated virtual seat instances, users gain full assurance that their selected ticket is guaranteed secured during checkout settlement.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-6">
              <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                CORE CORE CAPABILITIES
              </h3>

              <div className="space-y-4">
                {[
                  { title: "200ms Transaction Cycle", desc: "Locks seat coordinate assets globally in less than 200 milliseconds.", icon: Cpu },
                  { title: "Zero Conversional Fees", desc: "No artificial handling fees or payment platform markups. Transparency at core.", icon: Shield },
                  { title: "Scalper Protection", desc: "Integrated behavioral detection system blockbot algorithms instantly.", icon: Activity },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="w-10 h-10 border border-blue-200 text-blue-600 flex items-center justify-center bg-blue-50 flex-shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-950">{item.title}</h4>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-8 border-t border-gray-150 pt-6 flex items-center gap-3">
              <Server size={18} className="text-green-600 animate-pulse" />
              <span className="text-[10px] font-mono text-gray-400">GATEWAY_VERSION: v2.4.11-SECURE</span>
            </div>
          </div>
        </div>

        {/* Core Stats Panel */}
        <div className="bg-gray-950 text-white p-8 sm:p-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-gray-800 shadow-xl rounded-sm">
          {[
            { value: "200ms", label: "LOCK SETTLEMENT" },
            { value: "0%", label: "SURCHARGE FEES" },
            { value: "99.99%", label: "THROUGHPUT RATE" },
            { value: "32M+", label: "SECURED SEATS" },
          ].map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="text-2xl sm:text-4xl font-black text-[#BFFF00] tracking-tight">{stat.value}</div>
              <div className="text-[10px] font-mono text-gray-500 font-bold tracking-wider uppercase">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
