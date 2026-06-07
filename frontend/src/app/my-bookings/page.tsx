"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

// Initialize the font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<any | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchMyBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/v1/bookings/my", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mapped = data.map((b: any) => {
          let dateStr = b.startTime;
          try {
            const d = new Date(b.startTime);
            if (!isNaN(d.getTime())) {
              dateStr =
                d.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }) +
                " • " +
                d.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
            }
          } catch (e) {
            /* ignore */
          }

          let finalImage = b.imageUrl;
          if (!finalImage || finalImage.trim() === "") {
            finalImage =
              "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400";
          }

          return {
            id: b.bookingReference,
            title: b.eventTitle,
            date: dateStr,
            venue: b.venue,
            seats: `${b.seatNumber} · ${b.hallName || "StandardSeating"}`,
            price: `£${(b.price || 150.0).toFixed(2)}`,
            status: b.status,
            image: finalImage,
            rawStartTime: b.startTime,
          };
        });
        setBookings(mapped);
      }
    } catch (err) {
      console.error("Failed to load user bookings from backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleCancelRequest = (booking: any) => {
    setSelectedBookingForCancel(booking);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    setCancelling(true);
    setMessage(null);
    try {
      const response = await fetch(`http://localhost:8080/api/v1/bookings/${selectedBookingForCancel.id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
        },
      });
      if (response.ok) {
        setMessage({ text: "Ticket cancelled successfully. Your seat has been released.", type: "success" });
        await fetchMyBookings();
        setTimeout(() => {
          setShowCancelModal(false);
          setSelectedBookingForCancel(null);
          setMessage(null);
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.error || "Failed to cancel ticket.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Failed to connect to backend server.", type: "error" });
    } finally {
      setCancelling(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const eventDate = new Date(booking.rawStartTime);
    const isPast = !isNaN(eventDate.getTime()) && eventDate < new Date();
    
    if (activeTab === "cancelled") {
      return booking.status === "CANCELLED";
    }
    if (activeTab === "past") {
      return booking.status !== "CANCELLED" && isPast;
    }
    // upcoming
    return booking.status !== "CANCELLED" && !isPast;
  });

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8F9FB] text-gray-900 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
            My Bookings
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-500 italic font-medium">
            Seats don't wait. Tickets secured.
          </p>
        </div>

        {/* Tabs - Enabled fluid touch panning */}
        <div className="flex gap-6 sm:gap-8 border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto no-scrollbar touch-pan-x">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap border-b-2 transition-all ${
              activeTab === "upcoming" ? "text-blue-600 border-blue-600" : "text-gray-500 hover:text-gray-900 border-transparent"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap border-b-2 transition-all ${
              activeTab === "past" ? "text-blue-600 border-blue-600" : "text-gray-500 hover:text-gray-900 border-transparent"
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap border-b-2 transition-all ${
              activeTab === "cancelled" ? "text-blue-600 border-blue-600" : "text-gray-500 hover:text-gray-900 border-transparent"
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4 sm:space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm font-medium">Fetching tickets from registry...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm">
              <p className="text-gray-500 text-sm mb-6 font-medium">
                No tickets found under this category.
              </p>
              <Link
                href="/events"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs sm:text-sm font-bold tracking-wider text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors uppercase"
              >
                Find Live Events
              </Link>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col md:flex-row p-4 sm:p-5 gap-4 md:gap-6 group"
              >
                {/* Event Image */}
                <div className="w-full md:w-[140px] lg:w-[160px] h-48 md:h-[140px] lg:h-[160px] flex-shrink-0">
                  <img
                    src={booking.image}
                    alt={booking.title}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col md:flex-row justify-between gap-4 lg:gap-6 py-1">
                  {/* Event Details */}
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {booking.title}
                    </h3>
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-medium line-clamp-1">
                          {booking.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-xs sm:text-sm font-medium line-clamp-1">
                          {booking.venue}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Details */}
                  <div className="md:w-[160px] lg:w-[200px] flex flex-col justify-center md:items-start flex-shrink-0 mt-2 md:mt-0">
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1">
                      Seats
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 mb-1.5 sm:mb-2 line-clamp-2">
                      {booking.seats}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-mono text-gray-400 tracking-wide break-all">
                      #{booking.id}
                    </p>
                  </div>
                </div>

                {/* Desktop Dashed Divider */}
                <div className="hidden md:block w-px border-l border-dashed border-gray-300 my-2"></div>
                {/* Mobile Dashed Divider */}
                <div className="block md:hidden h-px w-full border-t border-dashed border-gray-200 my-1"></div>

                {/* Action Area (Status, Price, View/Cancel) */}
                <div className="md:w-[150px] lg:w-[190px] flex flex-row md:flex-col justify-between items-center md:items-end flex-shrink-0 py-1 gap-4">
                  <div className="flex md:flex-col justify-between md:items-end items-center w-auto gap-3 md:gap-2">
                    <span className={`text-[8px] sm:text-[9px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider text-white ${
                      booking.status === "CANCELLED" ? "bg-red-500" : booking.status === "CONFIRMED" ? "bg-emerald-600" : "bg-[#1860D4]"
                    }`}>
                      {booking.status}
                    </span>
                    <span className="text-blue-700 font-medium text-base sm:text-lg md:mt-1">
                      {booking.price}
                    </span>
                  </div>

                  <div className="flex md:flex-col gap-2 w-full justify-end items-end">
                    {booking.status !== "CANCELLED" && (
                      <button
                        onClick={() => {
                          router.push(`/booking/${booking.id}/confirmation`);
                        }}
                        className="w-full text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-600 uppercase flex items-center justify-center gap-1.5 hover:text-blue-800 transition-colors py-1.5 border border-blue-200 rounded-md hover:bg-blue-50/50 min-h-[36px]"
                      >
                        VIEW TICKET <ArrowRight size={14} />
                      </button>
                    )}
                    {activeTab === "upcoming" && (
                      <button
                        onClick={() => handleCancelRequest(booking)}
                        className="w-full text-[10px] sm:text-[11px] font-bold tracking-widest text-red-600 uppercase flex items-center justify-center gap-1.5 hover:text-red-850 transition-colors py-1.5 border border-red-200 rounded-md hover:bg-red-50/50 min-h-[36px]"
                      >
                        CANCEL TICKET
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* CANCELLATION MODAL */}
      {showCancelModal && selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Cancel Reservation?</h3>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Are you sure you want to cancel your seat <strong className="text-gray-900 font-semibold">{selectedBookingForCancel.seats}</strong> for <strong className="text-gray-900 font-semibold">{selectedBookingForCancel.title}</strong>? This action will immediately release the seat back into public inventory and cannot be undone.
            </p>
            
            {message && (
              <div className={`p-4 rounded-lg mb-6 text-sm font-semibold flex items-center gap-2 ${
                message.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse" : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-4 justify-end">
              <button
                disabled={cancelling}
                onClick={() => {
                  setShowCancelModal(false);
                  setSelectedBookingForCancel(null);
                  setMessage(null);
                }}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-sm rounded-lg transition-colors min-h-[44px]"
              >
                Go Back
              </button>
              <button
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-red-650 hover:bg-red-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 min-h-[44px]"
              >
                {cancelling ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2 font-extrabold text-base sm:text-lg text-blue-900 tracking-tight">
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

          <div className="text-center text-[10px] sm:text-xs text-gray-500 font-medium">
            © 2026 Ticketizer. Seats don't wait.
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-semibold text-gray-600">
            <Link
              href="/help"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Help
            </Link>
            <Link
              href="/contact"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Contact
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-gray-900 transition-colors py-1"
            >
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
