"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Initialize the font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function MyBookingsPage() {
  const router = useRouter();
  const [customBookings, setCustomBookings] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("tkz_bookings");
    if (saved) {
      setCustomBookings(JSON.parse(saved));
    }
  }, []);

  // Mock data matching the design
  const mockBookings = [
    {
      id: "TKZ-2026-00147",
      title: "IPL Final 2026",
      date: "Sunday, May 24 • 19:30 IST",
      venue: "Narendra Modi Stadium, Ahmedabad",
      seats: "A-12, A-13 · Premium",
      price: "₹10,500",
      status: "CONFIRMED",
      image:
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "TKZ-2026-08922",
      title: "Coldplay India 2026",
      date: "Friday, Nov 12 • 20:00 IST",
      venue: "DY Patil Stadium, Mumbai",
      seats: "GA-Floor-256",
      price: "₹6,500",
      status: "CONFIRMED",
      image:
        "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "TKZ-2026-00344",
      title: "Mumbai Comedy Night",
      date: "Wednesday, June 10 • 21:00 IST",
      venue: "The Habitat, Mumbai",
      seats: "Row C, Seat 15",
      price: "₹1,200",
      status: "CONFIRMED",
      image:
        "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=400",
    },
  ];

  const bookings = [...customBookings, ...mockBookings];

  // Determine if a booking ID is a real UUID (from our system) vs a mock ID
  const isRealBooking = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8F9FB] text-gray-900 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-8 lg:gap-12">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 font-extrabold text-lg sm:text-xl tracking-tight text-blue-900"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-8 text-sm font-bold text-gray-500 mt-1 uppercase tracking-wider">
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

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-gray-900 leading-tight">
              Shvet Ghare
            </span>
            <span className="text-xs font-medium text-gray-500 leading-tight">
              @shvet_g
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold shadow-sm cursor-pointer hover:bg-blue-800 transition-colors">
            SG
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-sm sm:text-base text-gray-500 italic font-medium">
            Seats don't wait. Tickets secured.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 sm:gap-8 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
          <button className="text-blue-600 border-b-2 border-blue-600 pb-3 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap">
            Upcoming
          </button>
          <button className="text-gray-500 hover:text-gray-900 pb-3 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap">
            Past
          </button>
          <button className="text-gray-500 hover:text-gray-900 pb-3 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap">
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4 sm:space-y-6">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col lg:flex-row p-4 gap-4 lg:gap-6 group"
            >
              {/* Event Image */}
              <div className="w-full lg:w-[160px] h-[160px] flex-shrink-0">
                <img
                  src={booking.image}
                  alt={booking.title}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col lg:flex-row justify-between gap-6 py-1">
                {/* Event Details */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                    {booking.title}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm font-medium">
                        {booking.date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin size={16} className="text-gray-400" />
                      <span className="text-sm font-medium">
                        {booking.venue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seat Details */}
                <div className="lg:w-[200px] flex flex-col justify-center lg:items-start flex-shrink-0">
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                    Seats
                  </p>
                  <p className="text-sm font-bold text-gray-900 mb-2">
                    {booking.seats}
                  </p>
                  <p className="text-[11px] font-mono text-gray-400 tracking-wide">
                    #{booking.id}
                  </p>
                </div>
              </div>

              {/* Desktop Dashed Divider */}
              <div className="hidden lg:block w-px border-l border-dashed border-gray-300 my-2"></div>
              {/* Mobile Dashed Divider */}
              <div className="block lg:hidden h-px w-full border-t border-dashed border-gray-200 my-2"></div>

              {/* Action Area (Status, Price, View Ticket) */}
              <div className="lg:w-[180px] flex flex-row lg:flex-col justify-between items-center lg:items-end flex-shrink-0 py-1">
                <div className="flex lg:flex-col justify-between lg:items-end items-center w-full lg:w-auto gap-3 lg:gap-2">
                  <span className="bg-[#1860D4] text-white text-[9px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider">
                    {booking.status}
                  </span>
                  <span className="text-blue-700 font-medium text-lg lg:mt-1">
                    {booking.price}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (isRealBooking(booking.id)) {
                      router.push(`/booking/${booking.id}/confirmation`);
                    } else {
                      alert(`Booking Reference: ${booking.id}\nStatus: ${booking.status}`);
                    }
                  }}
                  className="text-[11px] font-bold tracking-widest text-blue-600 uppercase flex items-center gap-1.5 hover:text-blue-800 transition-colors group-hover:translate-x-1 duration-300"
                >
                  VIEW TICKET <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-extrabold text-lg text-blue-900 tracking-tight">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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

          <div className="text-center text-xs text-gray-500 font-medium">
            © 2024 Ticketizer. Seats don't wait.
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-gray-600">
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Help
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Contact
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </footer>

      {/* Utilities */}
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
