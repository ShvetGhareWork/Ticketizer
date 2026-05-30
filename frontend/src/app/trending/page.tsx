"use client";

import React, { useState } from "react";
import { TrendingUp, Flame, Zap, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const TRENDING_ITEMS = [
  {
    rank: "01",
    title: "Coldplay: Music of the Spheres Tour",
    category: "CONCERT",
    velocity: "987 ticket locks / min",
    progress: 94,
    status: "CRITICAL DEMAND",
    statusColor: "bg-red-500 text-white",
    image: "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=800",
  },
  {
    rank: "02",
    title: "IPL Finals 2026",
    category: "CRICKET",
    velocity: "1,240 ticket locks / min",
    progress: 99,
    status: "SEATS EXTREMELY LIMITED",
    statusColor: "bg-[#BFFF00] text-gray-900",
    image: "https://images.unsplash.com/photo-1540747737956-37872404a8de?auto=format&fit=crop&q=80&w=800",
  },
  {
    rank: "03",
    title: "Diljit Dosanjh - Dil-Luminati India Tour",
    category: "FESTIVAL",
    velocity: "765 ticket locks / min",
    progress: 88,
    status: "SELLING FAST",
    statusColor: "bg-blue-600 text-white",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
  },
  {
    rank: "04",
    title: "The Weeknd Global Arenas Tour",
    category: "CONCERT",
    velocity: "450 ticket locks / min",
    progress: 72,
    status: "LIVE BOOKINGS ONGOING",
    statusColor: "bg-purple-600 text-white",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
  },
  {
    rank: "05",
    title: "Taylor Swift Eras Tour Encore",
    category: "CONCERT",
    velocity: "1,450 ticket locks / min",
    progress: 98,
    status: "99% LOCKED OUT",
    statusColor: "bg-amber-500 text-gray-900",
    image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800",
  },
];

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState("All");

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
              <TrendingUp size={14} className="animate-pulse" />
              REAL-TIME TRANSACTION FLOW
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Trending Gateways.
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Monitor the live settlement velocity of top-demand entertainment gateways. Zero artificial delays, absolute transparency on real-time availability.
            </p>
          </div>
        </div>

        {/* Global Live Ticker Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { label: "TRANSACTIONS (24H)", value: "324,891 locks", icon: ShieldCheck, color: "text-green-600 bg-green-50 border-green-200" },
            { label: "PEAK VELOCITY", value: "2,410 tickets/min", icon: Zap, color: "text-blue-600 bg-blue-50 border-blue-200" },
            { label: "ACTIVE LOCK QUEUE", value: "18.3k concurrents", icon: Flame, color: "text-red-600 bg-red-50 border-red-200" },
          ].map((stat, i) => {
            const IconComponent = stat.icon;
            return (
              <div key={i} className={`p-6 border rounded-sm flex items-center justify-between bg-white shadow-sm ${stat.color.split(" ")[2]}`}>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-gray-400 tracking-wider uppercase block">{stat.label}</span>
                  <span className="text-lg sm:text-xl font-black text-gray-900">{stat.value}</span>
                </div>
                <div className={`w-12 h-12 rounded-sm border flex items-center justify-center ${stat.color}`}>
                  <IconComponent size={20} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar py-1">
          {["All", "Concert", "Cricket", "Festival"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab.toUpperCase()}s
            </button>
          ))}
        </div>

        {/* Rankings List */}
        <div className="space-y-6">
          {TRENDING_ITEMS.filter(item => activeTab === "All" || item.category === activeTab.toUpperCase()).map((item) => (
            <div
              key={item.rank}
              className="bg-white border border-gray-200 hover:border-blue-600 p-6 flex flex-col lg:flex-row items-center gap-6 lg:gap-10 transition-colors group shadow-sm"
            >
              {/* Rank Counter */}
              <div className="text-4xl sm:text-6xl font-black font-mono text-gray-155 group-hover:text-blue-50 transition-colors select-none">
                {item.rank}
              </div>

              {/* Photo Thumbnail */}
              <div className="w-full lg:w-44 h-28 bg-gray-100 overflow-hidden relative border border-gray-150 flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
              </div>

              {/* Central Information */}
              <div className="flex-grow flex flex-col gap-2 w-full text-center lg:text-left">
                <div className="flex flex-wrap gap-2 items-center justify-center lg:justify-start">
                  <span className="bg-gray-100 text-gray-700 text-[9px] font-extrabold tracking-wider px-2 py-0.5 uppercase">
                    {item.category}
                  </span>
                  <span className={`text-[9px] font-extrabold tracking-wider px-2 py-0.5 ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <span className="text-xs font-mono font-bold text-gray-400 flex items-center justify-center lg:justify-start gap-1">
                  <Zap size={13} className="text-blue-600" />
                  VELOCITY: {item.velocity}
                </span>
              </div>

              {/* Progress & Lock Stats */}
              <div className="w-full lg:w-48 flex flex-col gap-1.5 justify-center">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>QUEUE ALLOCATION</span>
                  <span className="text-gray-900">{item.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 border border-gray-200">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              {/* Action Button */}
              <Link
                href="/events"
                className="w-full lg:w-auto bg-gray-950 text-white group-hover:bg-blue-600 group-hover:text-white px-6 py-3.5 font-extrabold text-xs tracking-wider uppercase text-center flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 flex-shrink-0"
              >
                SECURE LOCKS <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
