"use client";

import React, { useState } from "react";
import { Search, ArrowRight, Share2, Bell, LogOut, User } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

// Initialize the premium, extensive font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function TicketizerLanding() {
  const router = useRouter();
  const { authToken, logout } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  // --- Data for the Events Grid ---
  const events = [
    {
      id: 1,
      tag: "LIVE SALE",
      tagColor: "bg-white text-gray-900",
      image:
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
      date: "26 MAY 2026 — MUMBAI",
      title: "IPL FINAL 2026",
      price: "From ₹5,000",
    },
    {
      id: 2,
      tag: "FAST FILLING",
      tagColor: "bg-blue-600 text-white",
      image:
        "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=800",
      date: "18 JUN 2026 — DELHI",
      title: "COLDPLAY: MUSIC OF SPHERES",
      price: "From ₹4,500",
    },
    {
      id: 3,
      tag: "",
      tagColor: "",
      image:
        "https://images.unsplash.com/photo-1470229722913-7c090be5c524?auto=format&fit=crop&q=80&w=800",
      date: "02 JUL 2026 — BENGALURU",
      title: "DILJIT DOSANJH TOUR",
      price: "From ₹2,500",
    },
    {
      id: 4,
      tag: "",
      tagColor: "",
      image:
        "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=800",
      date: "12 AUG 2026 — MUMBAI",
      title: "ZAKIR KHAN LIVE",
      price: "From ₹999",
    },
    {
      id: 5,
      tag: "",
      tagColor: "",
      image:
        "https://images.unsplash.com/photo-1533174000255-124b17f54c9e?auto=format&fit=crop&q=80&w=800",
      date: "25 AUG 2026 — HYDERABAD",
      title: "LOLLAPALOOZA INDIA",
      price: "From ₹8,000",
    },
    {
      id: 6,
      tag: "",
      tagColor: "",
      image:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=800",
      date: "30 SEP 2026 — GOA",
      title: "SUNBURN FESTIVAL",
      price: "From ₹3,500",
    },
  ];

  const categories = [
    "All Events",
    "Cricket",
    "Concerts",
    "Comedy",
    "Football",
    "Theatre",
    "Festivals",
  ];

  // --- State for the Interactive Ticket Deck ---
  const [ticketDeck, setTicketDeck] = useState([
    {
      id: "t1",
      title: "IPL FINAL 2026",
      venue: "Wankhede Stadium",
      price: "₹5,000",
      tag: "LIVE",
      code: "#TKZ-94",
    },
    {
      id: "t2",
      title: "COLDPLAY INDIA",
      venue: "DY Patil Stadium",
      price: "₹4,500",
      tag: "FAST",
      code: "#TKZ-22",
    },
    {
      id: "t3",
      title: "DILJIT DOSANJH",
      venue: "Mahalaxmi Racecourse",
      price: "₹2,500",
      tag: "NEW",
      code: "#TKZ-07",
    },
  ]);

  // Function to cycle the top card to the back of the deck
  const cycleCardToBack = () => {
    setTicketDeck((prev) => {
      const newDeck = [...prev];
      const topCard = newDeck.shift(); // Remove the first item
      if (topCard) newDeck.push(topCard); // Add it to the end
      return newDeck;
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/events");
    }
  };

  const getTicketTargetUrl = (ticketId: string) => {
    if (ticketId === "t1") return "/events/1";
    if (ticketId === "t2") return "/events/2";
    return "/events/3";
  };

  return (
    <div
      className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col overflow-x-hidden ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <div className="w-3 h-3 bg-[#BFFF00]"></div>
            Ticketizer
          </Link>
          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
            <Link
              href="/events"
              className="text-blue-600 border-b-2 border-blue-600 pb-1"
            >
              EVENTS
            </Link>
            <Link href="/my-bookings" className="hover:text-gray-900 transition-colors">
              MY BOOKINGS
            </Link>
          </div>
        </div>
        {/* Auth Buttons */}
        <div className="flex items-center gap-4 lg:gap-6">
          {authToken ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-sm border border-gray-200">
                <User size={13} className="text-blue-600" />
                SECURE KEY ACTIVE
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/auth/login");
                }}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-sm transition-all"
              >
                <LogOut size={14} />
                Sign Out
              </button>
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

      {/* HERO SECTION */}
      <section className="relative flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-10 lg:py-24 overflow-hidden border-b border-gray-200">
        {/* Faint Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 z-0"
          style={{
            backgroundImage:
              "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          {/* Left Column: Typography & Search */}
          <div className="flex flex-col gap-6 lg:gap-8 mt-4 lg:mt-0">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 bg-blue-600"></span>
              Live Now — 3 events on sale
            </div>

            {/* Responsive Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-extrabold tracking-tight leading-[1.05] text-gray-900">
              Find your seat.
              <br className="hidden sm:block" />
              Book it before
              <br className="hidden sm:block" /> someone else does.
            </h1>

            <p className="text-gray-500 text-sm sm:text-base lg:text-lg max-w-md font-medium leading-relaxed">
              IPL finals, concerts, comedy nights — real-time seat inventory. No
              waiting. No bots. Just pure access.
            </p>

            {/* Responsive Search Component */}
            <form
              onSubmit={handleSearchSubmit}
              className="mt-2 flex flex-col sm:flex-row w-full max-w-xl border border-gray-200 bg-white rounded shadow-sm focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all"
            >
              <div className="hidden sm:flex items-center pl-4 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search artist, team or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 sm:py-4 px-4 sm:px-3 outline-none text-gray-900 placeholder-gray-400 font-medium bg-transparent text-sm sm:text-base"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 sm:py-4 font-bold tracking-wide hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                SEARCH <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Right Column: Animated Card Stack (Now visible and responsive on Mobile!) */}
          <div className="flex justify-center lg:justify-end relative h-[320px] sm:h-[400px] lg:h-[500px] items-center mt-10 lg:mt-0">
            {/* Background decorative 'B' */}
            <div className="absolute inset-y-0 right-0 lg:w-3/4 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[120px] sm:text-[180px] lg:text-[240px] font-black leading-none transform rotate-90 origin-center text-gray-900">
                BOOK
              </span>
            </div>

            {/* Interactive Ticket Stack */}
            <div className="relative w-64 sm:w-72 lg:w-80 h-56 sm:h-64 z-10 mr-4 lg:mr-0">
              {ticketDeck.map((ticket, index) => {
                const isTopCard = index === 0;
                const targetUrl = getTicketTargetUrl(ticket.id);
                return (
                  <motion.div
                    key={ticket.id}
                    layout // This enables smooth reordering animations automatically
                    initial={false}
                    animate={{
                      top: index * 12, // Stepped down visually
                      right: index * -16, // Stepped to the right
                      scale: 1 - index * 0.04, // Slightly smaller as they go back
                      rotate: isTopCard ? -3 : index * 2, // Only the top card tilts left
                      zIndex: ticketDeck.length - index,
                      opacity: 1 - index * 0.15,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    onClick={isTopCard ? cycleCardToBack : undefined}
                    className={`absolute w-full bg-white border border-gray-200 shadow-2xl p-5 sm:p-6 transition-colors duration-300 ${
                      isTopCard
                        ? "cursor-pointer hover:border-blue-300"
                        : "cursor-default"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                      <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] px-2 py-1 font-bold tracking-wide uppercase rounded-sm">
                        {ticket.tag}
                      </span>
                      <span className="text-gray-400 text-[10px] sm:text-xs font-mono">
                        {ticket.code}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xl sm:text-2xl mb-1 text-gray-900 tracking-tight">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 font-medium">
                      {ticket.venue}
                    </p>

                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 sm:pt-6">
                      <span className="text-blue-600 font-bold text-base sm:text-lg">
                        {ticket.price}
                      </span>

                      {/* The Arrow Button links to the event detail page */}
                      <Link
                        href={targetUrl}
                        onClick={(e) => e.stopPropagation()} // Prevent clicking the arrow from cycling the card
                        className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors rounded-sm shadow-md hover:shadow-lg z-20"
                      >
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BLUE TICKER STRIP */}
      <div className="bg-blue-600 text-white py-2.5 overflow-hidden whitespace-nowrap flex text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase">
        <div className="animate-marquee inline-block">
          <span className="mx-4 sm:mx-8">
            IPL FINAL 2026 - SOLD 1,247 TICKETS TODAY
          </span>{" "}
          •<span className="mx-4 sm:mx-8">DILJIT DOSANJH MUMBAI TOUR</span> •
          <span className="mx-4 sm:mx-8">
            COLDPLAY INDIA 2026 - SEATS FILLING FAST
          </span>{" "}
          •
          <span className="mx-4 sm:mx-8">
            IPL FINAL 2026 - SOLD 1,247 TICKETS TODAY
          </span>{" "}
          •<span className="mx-4 sm:mx-8">DILJIT DOSANJH MUMBAI TOUR</span>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="bg-[#F8F9FA]">
        {/* CATEGORY FILTER BAR */}
        <div className="bg-[#EBECEF] border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-6 flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar items-center">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() =>
                  router.push(`/events?category=${encodeURIComponent(cat)}`)
                }
                className={`whitespace-nowrap px-4 py-2 sm:px-6 sm:py-2.5 border rounded-sm text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  i === 0
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* EVENTS GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 lg:py-24">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-gray-900 uppercase">
              Featured Events
            </h2>
            <Link
              href="/events"
              className="text-blue-600 text-xs sm:text-sm font-bold flex items-center gap-1 hover:underline"
            >
              VIEW ALL <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => router.push(`/events/${event.id}`)}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-600 transition-colors group cursor-pointer shadow-sm hover:shadow-md"
              >
                <div className="h-40 sm:h-48 relative overflow-hidden bg-gray-200">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {event.tag && (
                    <div
                      className={`absolute top-4 left-4 text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-sm ${event.tagColor}`}
                    >
                      {event.tag}
                    </div>
                  )}
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-blue-600 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-2">
                    {event.date}
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-6 sm:mb-8 line-clamp-1">
                    {event.title}
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-mono font-bold text-sm sm:text-base">
                      {event.price}
                    </span>
                    <span className="text-gray-900 text-[10px] sm:text-xs font-bold tracking-wide flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      BOOK NOW{" "}
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-12 sm:py-16 lg:py-24 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="mb-10 lg:mb-16 max-w-xl text-center sm:text-left mx-auto sm:mx-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 sm:mb-4">
                Simple. Fast. Final.
              </h2>
              <p className="text-gray-500 text-sm sm:text-base font-medium">
                Our system is engineered for the highest load events on the
                planet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-12 text-center sm:text-left">
              {[
                {
                  step: "01",
                  title: "SEARCH",
                  desc: "Find your event using our real-time global database. No cached results, just live inventory.",
                },
                {
                  step: "02",
                  title: "SELECT",
                  desc: "Pick your exact seat using our interactive, high-precision map grid. What you see is available.",
                },
                {
                  step: "03",
                  title: "BOOK",
                  desc: "Instant confirmation. Our 200ms transaction cycle ensures you don't lose the seat to a bot.",
                },
              ].map((item) => (
                <div key={item.step}>
                  <div className="text-5xl sm:text-6xl font-black text-blue-100 mb-4 sm:mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-24 grid grid-cols-2 lg:flex lg:flex-row justify-center gap-4 sm:gap-6">
          {[
            { value: "50K+", label: "BOOKINGS DAILY" },
            { value: "200ms", label: "TRANS. TIME" },
            { value: "99.9%", label: "UP TIME" },
            { value: "₹0", label: "CONV. FEES" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 text-center lg:flex-1 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-600 mb-1 sm:mb-2">
                {stat.value}
              </div>
              <div className="text-[8px] sm:text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* CTA BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-12 sm:pb-16 lg:pb-24">
          <div className="bg-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-16 flex flex-col lg:flex-row justify-between items-center text-center lg:text-left gap-6 sm:gap-8 shadow-xl">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 sm:mb-3">
                NEVER MISS ANOTHER BEAT.
              </h2>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg font-medium">
                Join 2 million fans getting the best seats first.
              </p>
            </div>
            <button
              onClick={() => router.push("/auth/register")}
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-md font-bold text-xs sm:text-sm tracking-wide shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap w-full lg:w-auto cursor-pointer"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-12 lg:py-16 flex flex-col md:flex-row justify-between gap-10 md:gap-12">
          <div className="max-w-xs text-center md:text-left mx-auto md:mx-0">
            <Link
              href="/"
              className="font-extrabold text-lg sm:text-xl tracking-tight mb-3 sm:mb-4 text-blue-900 flex items-center justify-center md:justify-start gap-2 cursor-pointer"
            >
              <div className="w-3 h-3 bg-[#BFFF00]"></div>
              Ticketizer
            </Link>
            <p className="text-gray-500 text-[10px] sm:text-xs font-medium">
              © 2026 Ticketizer. Seats don&apos;t wait.
            </p>
          </div>

          <div className="flex justify-center md:justify-start gap-12 sm:gap-16 md:gap-24">
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold tracking-widest text-gray-900 uppercase mb-4 sm:mb-6">
                Product
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-500 font-medium">
                <li>
                  <Link href="#" className="hover:text-blue-600 transition-colors">
                    Help
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-600 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-600 transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] sm:text-xs font-bold tracking-widest text-gray-900 uppercase mb-4 sm:mb-6">
                Legal
              </h4>
              <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-500 font-medium">
                <li>
                  <Link href="#" className="hover:text-blue-600 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-blue-600 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center md:justify-end gap-4 items-start">
            <button className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors bg-gray-50 cursor-pointer">
              <Share2 size={14} />
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors bg-gray-50 cursor-pointer">
              <Bell size={14} />
            </button>
          </div>
        </div>
      </footer>

      {/* CSS for marquee animation & utilities */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        /* Hide scrollbar for category filters */
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
