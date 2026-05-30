"use client";

import React, { useState } from "react";
import { Search, MapPin, Ticket, Shield, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const PRESETS_VENUES = [
  {
    id: "v1",
    name: "Wembley Stadium",
    city: "London",
    country: "United Kingdom",
    capacity: "90,000",
    type: "Stadium",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "Coldplay - Music of the Spheres Tour",
    status: "HIGH DEMAND",
    statusColor: "bg-red-500 text-white",
  },
  {
    id: "v2",
    name: "Narendra Modi Stadium",
    city: "Ahmedabad",
    country: "India",
    capacity: "132,000",
    type: "Stadium",
    image: "https://images.unsplash.com/photo-1540747737956-37872404a8de?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "IPL Final 2026",
    status: "EXCLUSIVE LOCKS",
    statusColor: "bg-[#BFFF00] text-gray-900",
  },
  {
    id: "v3",
    name: "Madison Square Garden",
    city: "New York",
    country: "United States",
    capacity: "20,789",
    type: "Arena",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "The Weeknd Live",
    status: "FAST BOOKING",
    statusColor: "bg-blue-600 text-white",
  },
  {
    id: "v4",
    name: "Royal Albert Hall",
    city: "London",
    country: "United Kingdom",
    capacity: "5,272",
    type: "Theatre",
    image: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "Classical Gala Concert",
    status: "LIMITED ENTRY",
    statusColor: "bg-amber-500 text-gray-900",
  },
  {
    id: "v5",
    name: "Sydney Opera House",
    city: "Sydney",
    country: "Australia",
    capacity: "5,738",
    type: "Theatre",
    image: "https://images.unsplash.com/photo-1528072164453-f4e8ef0d475a?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "Sydney Symphony Orchestra",
    status: "SEATS AVAILABLE",
    statusColor: "bg-green-600 text-white",
  },
  {
    id: "v6",
    name: "Red Rocks Amphitheatre",
    city: "Morrison, CO",
    country: "United States",
    capacity: "9,525",
    type: "Amphitheatre",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=800",
    featuredEvent: "Tame Impala Concert",
    status: "SELLING FAST",
    statusColor: "bg-purple-600 text-white",
  },
];

export default function VenuesPage() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filteredVenues = PRESETS_VENUES.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(search.toLowerCase()) ||
      venue.city.toLowerCase().includes(search.toLowerCase()) ||
      venue.country.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === "All" || venue.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12">
        {/* Banner header */}
        <div className="mb-12 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <Sparkles size={14} className="animate-spin-slow" />
              GLOBAL GATEWAY NETWORK
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              World-Class Venues.
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Explore partners stadiums, theaters and arenas. Seamlessly map real-time inventory and book securely inside the Ticketizer console.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-10 justify-between items-center bg-white border border-gray-200 p-4 shadow-sm">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by venue name, city, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 font-medium text-sm transition-colors"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
            {["All", "Stadium", "Arena", "Theatre", "Amphitheatre"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-2.5 text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
                  filterType === type
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length === 0 ? (
          <div className="border border-dashed border-gray-300 p-12 text-center text-gray-400 font-bold tracking-wider uppercase text-sm bg-white">
            No matching venues registered in the gateway database.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-white border border-gray-200 hover:border-blue-600 transition-colors group flex flex-col shadow-sm"
              >
                <div className="h-48 relative overflow-hidden bg-gray-100">
                  <img
                    src={venue.image}
                    alt={venue.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <span className={`absolute top-4 left-4 text-[9px] font-extrabold tracking-wider px-2.5 py-1 ${venue.statusColor}`}>
                    {venue.status}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold uppercase mb-2">
                    <MapPin size={13} className="text-blue-600" />
                    {venue.city}, {venue.country}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {venue.name}
                  </h3>

                  <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium">CAPACITY LIMIT</span>
                      <span className="text-gray-900 font-extrabold">{venue.capacity}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-medium">GATEWAY STATUS</span>
                      <span className="text-green-600 font-extrabold flex items-center gap-1">
                        <Shield size={12} /> SECURED
                      </span>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 p-3 flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase">FEATURED EVENT</span>
                      <span className="text-xs font-bold text-gray-800 line-clamp-1">{venue.featuredEvent}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
