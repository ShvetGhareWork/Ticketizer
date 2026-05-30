"use client";

import React, { useState } from "react";
import { HelpCircle, Search, Terminal, MessageSquare, Shield, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const FAQS = [
  {
    category: "RESERVATIONS",
    question: "How does the 200ms seat lock guarantee work?",
    answer: "When you select a seat inside our high-precision seating grid, our core transactional engine locks that asset globally. No other concurrent user or automated ticket crawler can access or checkout that specific seat for 5 minutes, giving you absolute time to settle payment without bot hijacking.",
  },
  {
    category: "PAYMENT",
    question: "What currencies and settlement methods are supported?",
    answer: "We support direct transactional gateway settlements via major credit cards, UPI, Google Pay, Apple Pay, and standard bank transfers. All transactions are routed through an encrypted multi-signature security tunnel.",
  },
  {
    category: "REFUNDS",
    question: "Can I cancel a locked booking or request a refund?",
    answer: "Because we settle seat allocations in real-time directly with the event creators, all completed bookings are final. However, if an event is postponed or cancelled, our engine initiates an automatic full refund directly to your source gateway account within 24 hours.",
  },
  {
    category: "SELECTION",
    question: "What should I do if my lock session expires?",
    answer: "If the 5-minute allocation window expires before completing checkout, the seat inventory is released back into the pool. Simply return to the event page, select the seat grid, and lock the inventory again.",
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Custom terminal simulation state
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "SYS: Ticketizer DevOps support console initialized.",
    "SYS: Standard response latency 12ms. Ready to diagnose portal issues.",
  ]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const userInput = terminalInput.trim();
    setTerminalLogs((prev) => [...prev, `USER: ${userInput}`]);
    setTerminalInput("");

    // Simulate DevOps diagnostics
    setTimeout(() => {
      let response = "SYS: Query received. Diagnostic trace initialized.";
      const query = userInput.toLowerCase();

      if (query.includes("lock") || query.includes("seat")) {
        response = "DIAGNOSTIC: Locks are held for exactly 300s. Verify your session cookie remains active.";
      } else if (query.includes("refund") || query.includes("cancel")) {
        response = "DIAGNOSTIC: Real-time settlement active. All successful checkouts are immutable.";
      } else if (query.includes("error") || query.includes("fail")) {
        response = "SYS_ALERT: Zero errors recorded in the last 15 minutes. Check client-side browser network.";
      } else {
        response = `SYS: DevOps engineer alerted. Query hash stored: [SHA256-${Math.floor(Math.random() * 900000) + 100000}].`;
      }
      setTerminalLogs((prev) => [...prev, response]);
    }, 600);
  };

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

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
              <HelpCircle size={14} className="animate-bounce" />
              SUPPORT OPERATIONAL CENTER
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Help Center & Diagnostics
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Find answers to ticket reservation, transactional locks, seat layouts, or chat directly with our mock DevOps engineering grid.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQs List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                SEARCH KNOWLEDGE BASE
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Type questions (e.g. seat lock, refunds...)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 font-medium text-sm transition-colors"
                />
              </div>

              {/* Category filters */}
              <div className="flex gap-2 pt-2 overflow-x-auto no-scrollbar">
                {["All", "RESERVATIONS", "PAYMENT", "REFUNDS", "SELECTION"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 text-[10px] font-bold border transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Rendered FAQs */}
            {filteredFaqs.length === 0 ? (
              <div className="border border-dashed border-gray-355 p-12 text-center text-gray-400 font-bold uppercase tracking-wider text-xs bg-white">
                No articles matches your query.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 p-6 shadow-sm space-y-3">
                    <span className="bg-blue-50 text-blue-600 text-[9px] font-extrabold tracking-wider px-2 py-0.5 uppercase border border-blue-100 rounded-sm">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">
                      {faq.question}
                    </h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DevOps Diagnostic Panel */}
          <div className="bg-gray-950 text-gray-100 border border-gray-800 p-6 shadow-xl flex flex-col gap-5 min-h-[400px] font-mono rounded-sm">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <span className="text-[10px] text-yellow-500 font-bold tracking-wider flex items-center gap-1.5">
                <Terminal size={14} /> DIAGNOSTIC CONSOLE v1.0
              </span>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
            </div>

            {/* Scrollable log panel */}
            <div className="flex-grow overflow-y-auto space-y-3 max-h-[300px] text-xs">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className={`${
                  log.startsWith("SYS:") ? "text-gray-400" :
                  log.startsWith("SYS_ALERT:") ? "text-red-500 font-bold" :
                  log.startsWith("DIAGNOSTIC:") ? "text-yellow-400 font-bold" :
                  "text-[#BFFF00] font-bold"
                }`}>
                  {log}
                </div>
              ))}
            </div>

            {/* Terminal Input */}
            <form onSubmit={handleTerminalSubmit} className="mt-auto border-t border-gray-800 pt-4 flex gap-2">
              <span className="text-blue-500 font-bold">&gt;</span>
              <input
                type="text"
                placeholder="Ask DevOps (e.g. check server, lock)..."
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                className="flex-grow bg-transparent outline-none text-white font-mono text-xs"
              />
            </form>

            <div className="flex justify-between items-center text-[10px] text-gray-500 border-t border-gray-800 pt-3">
              <span className="flex items-center gap-1"><Shield size={10} /> SSL ACTIVE</span>
              <span className="flex items-center gap-1"><Clock size={10} /> 12MS PING</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
