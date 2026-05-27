"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventCard from "@/components/EventCard";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

interface TicketmasterImage {
  url: string;
  width: number;
  height: number;
}

interface TicketmasterEvent {
  id: string;
  name: string;
  url: string;
  images?: TicketmasterImage[];
  dates?: {
    start?: {
      localDate?: string;
    };
  };
  _embedded?: {
    venues?: {
      name?: string;
      city?: {
        name?: string;
      };
    }[];
  };
  classifications?: {
    segment?: {
      name?: string;
    };
  }[];
}

export interface MappedEvent {
  id: string;
  title: string;
  date: string;
  venue: string;
  image: string;
  url: string;
  tags: { label: string; style: string }[];
  status: { label: string; style: string };
  price: string;
}

export default function EventsListing() {
  const router = useRouter();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicketmasterEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://app.ticketmaster.com/discovery/v2/events.json?countryCode=US&apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E",
        );
        if (res.ok) {
          const data = await res.json();
          const rawEvents: TicketmasterEvent[] = data._embedded?.events || [];
          const mapped: MappedEvent[] = rawEvents.map((e) => {
            const image =
              e.images?.reduce((prev, curr) =>
                prev.width > curr.width ? prev : curr,
              )?.url ||
              e.images?.[0]?.url ||
              "";
            const venue = e._embedded?.venues?.[0]?.name || "US Arena";
            const city = e._embedded?.venues?.[0]?.city?.name || "USA";
            return {
              id: e.id,
              title: e.name,
              date: e.dates?.start?.localDate || "2024-08-24",
              venue: `${venue}, ${city}`,
              image: image,
              url: e.url,
              tags: [
                {
                  label:
                    e.classifications?.[0]?.segment?.name?.toUpperCase() ||
                    "CONCERT",
                  style: "bg-white text-gray-900",
                },
                { label: "TICKETMASTER", style: "bg-blue-600 text-white" },
              ],
              status: {
                label: "SELLING FAST",
                style: "bg-blue-100 text-blue-700",
              },
              price: "£" + (Math.floor(Math.random() * 80) + 40) + ".00",
            };
          });
          setEvents(mapped);
        }
      } catch (err) {
        console.error("Failed to load events from Ticketmaster:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTicketmasterEvents();
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans selection:bg-blue-100 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* PAGE CONTENT */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              Discover Events
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-bold tracking-widest uppercase">
              142 Results near London
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
              className="lg:hidden flex items-center gap-2 border border-gray-300 bg-white px-4 py-2.5 rounded text-sm font-semibold hover:bg-gray-50"
            >
              <SlidersHorizontal size={16} /> Filters
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
              <span className="uppercase tracking-wider text-xs">Sort By:</span>
              <div className="relative border border-gray-300 bg-white rounded px-4 py-2.5 flex items-center justify-between w-40 cursor-pointer hover:border-gray-400 transition-colors">
                <span>RELEVANCE</span>
                <ChevronDown size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* LEFT SIDEBAR - FILTERS */}
          <aside
            className={`${isMobileFilterOpen ? "block" : "hidden"} lg:block w-full lg:w-[280px] flex-shrink-0 bg-white lg:bg-transparent p-6 lg:p-0 border border-gray-200 lg:border-none rounded-xl lg:rounded-none shadow-sm lg:shadow-none mb-6 lg:mb-0`}
          >
            <div className="bg-white lg:border border-gray-200 lg:rounded-xl lg:shadow-sm lg:p-6 lg:sticky lg:top-24">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-extrabold tracking-widest uppercase">
                  Filters
                </h3>
                <button className="text-blue-600 text-xs font-bold hover:underline">
                  CLEAR ALL
                </button>
              </div>

              {/* Category Filter */}
              <div className="mb-8">
                <h4 className="text-[11px] text-gray-500 font-bold tracking-widest uppercase mb-4">
                  Category
                </h4>
                <div className="space-y-3">
                  {["CONCERTS", "TECH & WEB3", "SPORTS", "COMEDY"].map(
                    (item, idx) => (
                      <label
                        key={item}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div
                          className={`w-4 h-4 rounded-sm flex items-center justify-center border ${idx === 0 ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}
                        >
                          {idx === 0 && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {item}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              {/* Date Filter */}
              <div className="mb-8">
                <h4 className="text-[11px] text-gray-500 font-bold tracking-widest uppercase mb-4">
                  Date
                </h4>
                <div className="space-y-3">
                  {["ALL DATES", "TONIGHT", "THIS WEEKEND"].map((item, idx) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${idx === 0 ? "border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}
                      >
                        {idx === 0 && (
                          <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] text-gray-500 font-bold tracking-widest uppercase">
                    Price Range
                  </h4>
                  <span className="text-xs font-bold text-blue-600">
                    $0 — $500
                  </span>
                </div>
                {/* Custom slider mock */}
                <div className="relative w-full h-1 bg-gray-200 rounded-full mt-2">
                  <div className="absolute left-0 top-0 h-full bg-blue-600 w-1/2 rounded-full"></div>
                  <div className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-sm cursor-pointer"></div>
                </div>
              </div>

              {/* City Filter */}
              <div className="mb-8">
                <h4 className="text-[11px] text-gray-500 font-bold tracking-widest uppercase mb-4">
                  City
                </h4>
                <div className="space-y-3">
                  {["LONDON", "BERLIN", "PARIS"].map((item, idx) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className={`w-4 h-4 rounded-sm flex items-center justify-center border ${idx === 0 ? "bg-blue-600 border-blue-600" : "border-gray-300 group-hover:border-blue-400"}`}
                      >
                        {idx === 0 && (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3 rounded-md font-bold text-sm hover:bg-blue-700 transition-colors">
                APPLY FILTERS
              </button>
            </div>
          </aside>

          {/* RIGHT CONTENT - EVENT GRID */}
          <div className="flex-1 flex flex-col">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
                <span className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                  FETCHING LIVE USA TICKETMASTER EVENTS...
                </span>
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-xl shadow-sm">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">
                  NO EVENTS FOUND
                </span>
                <p className="text-xs text-gray-400">
                  Please try refreshing the page or checking your connection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    id={String(event.id)}
                    title={event.title}
                    date={event.date}
                    venue={event.venue}
                    url={event.url}
                    image={event.image}
                    tags={event.tags}
                    statusLabel={event.status.label}
                    statusStyle={event.status.style}
                    price={event.price}
                    onClick={() => router.push(`/events/${event.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <ChevronLeft size={18} />
              </button>

              <button className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded font-bold text-sm shadow-sm">
                1
              </button>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
                2
              </button>
              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
                3
              </button>

              <span className="w-8 flex items-center justify-center text-gray-400 tracking-widest">
                ...
              </span>

              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">
                24
              </button>

              <button className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#EBECEF] mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Footer Logo & Copyright */}
          <div className="flex flex-col">
            <div className="font-extrabold text-xl tracking-tight mb-4 text-blue-900 flex items-center gap-2">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <rect x="3" y="8" width="18" height="8" rx="2" ry="2"></rect>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="8" x2="8" y2="16"></line>
                <line x1="16" y1="8" x2="16" y2="16"></line>
              </svg>
              Ticketizer
            </div>
            <p className="text-gray-500 text-sm font-medium">
              © 2024 Ticketizer. Seats don&apos;t wait.
            </p>
          </div>

          {/* Links Column 1 */}
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-5">
              Discover
            </h4>
            <ul className="space-y-4 text-sm text-gray-600 font-medium">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Venues
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Artist Directory
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Trending
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-blue-600 uppercase mb-5">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-gray-600 font-medium">
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Help
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="text-[11px] font-bold tracking-widest text-gray-900 uppercase mb-4">
              Stay Synced
            </h4>
            <div className="flex bg-white rounded shadow-sm border border-gray-200 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-all overflow-hidden">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2.5 text-sm outline-none text-gray-700 bg-transparent"
              />
              <button className="bg-blue-600 text-white px-5 py-2.5 font-bold text-xs tracking-wider hover:bg-blue-700 transition-colors">
                JOIN
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
