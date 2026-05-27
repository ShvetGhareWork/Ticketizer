"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Copy, Clock, Shield, ShieldAlert, Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Header";

// Initialize the font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

interface BookingDetails {
  bookingReference: string;
  status: string;
  qrCodePayload: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const { authToken, activeAllocation, clearActiveAllocation, addLog } = useApp();

  const [bookingData, setBookingData] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  // Capture seat labels at time of render before clearActiveAllocation() wipes them
  const [capturedSeats, setCapturedSeats] = useState<string>(
    activeAllocation?.seatLabels?.join(", ") || activeAllocation?.seatLabel || ""
  );
  // Pull event context stored in sessionStorage from the event detail page
  const [eventContext, setEventContext] = useState<{
    title: string; date: string; venue: string; city: string; time?: string;
  } | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    // Capture current seat labels before async work starts
    const currentSeats = activeAllocation?.seatLabels?.join(", ") || activeAllocation?.seatLabel || "A12";
    if (!capturedSeats && currentSeats) setCapturedSeats(currentSeats);

    // Load event context from sessionStorage
    try {
      const stored = sessionStorage.getItem("currentEvent");
      if (stored) {
        setEventContext(JSON.parse(stored));
        sessionStorage.removeItem("currentEvent");
      }
    } catch (e) { /* ignore */ }

    const fetchBookingDetails = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8080/api/v1/bookings/${bookingId}`, {
          headers: {
            "Authorization": `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBookingData(data);
          addLog("SUCCESS", `GATEWAY LOADED: Booking details synced successfully.`);
          
          const seatLabelsStr = capturedSeats || activeAllocation?.seatLabels?.join(", ") || "A12, A13";
          const seatCount = seatLabelsStr.split(", ").filter(Boolean).length;
          const eventTitle = eventContext?.title || "Live Event Booking";
          const eventDate = eventContext?.date ? `${eventContext.date} • ${eventContext?.time || ""}`.trim() : "Upcoming";
          const eventVenue = eventContext ? `${eventContext.venue}, ${eventContext.city}` : "Venue TBA";

          const savedBookings = JSON.parse(localStorage.getItem("tkz_bookings") || "[]");
          const exists = savedBookings.some((b: any) => b.id === bookingId);
          if (!exists) {
            savedBookings.unshift({
              id: bookingId,
              title: eventTitle,
              date: eventDate,
              venue: eventVenue,
              seats: `${seatLabelsStr} · Standard`,
              price: `$${(seatCount * 150.0 * 1.05).toFixed(2)}`,
              status: "CONFIRMED",
              image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400",
            });
            localStorage.setItem("tkz_bookings", JSON.stringify(savedBookings));
          }
          
          clearActiveAllocation();
        } else {
          throw new Error("Relational gateway refused to load booking reference.");
        }
      } catch (err) {
        const mockSeats = capturedSeats || activeAllocation?.seatLabels?.join(", ") || "A12, A13";
        const seatCount = mockSeats.split(", ").filter(Boolean).length;
        setBookingData({
          bookingReference: bookingId,
          status: "CONFIRMED",
          // Short payload triggers the SVG fallback on the QR display
          qrCodePayload: `TKZ::${bookingId.substring(0,8)}`,
        });
        
        const eventTitle = eventContext?.title || "Live Event Booking";
        const eventDate = eventContext?.date ? `${eventContext.date} • ${eventContext?.time || ""}`.trim() : "Upcoming";
        const eventVenue = eventContext ? `${eventContext.venue}, ${eventContext.city}` : "Venue TBA";

        const savedBookings = JSON.parse(localStorage.getItem("tkz_bookings") || "[]");
        const exists = savedBookings.some((b: any) => b.id === bookingId);
        if (!exists) {
          savedBookings.unshift({
            id: bookingId,
            title: eventTitle,
            date: eventDate,
            venue: eventVenue,
            seats: `${mockSeats} · Standard`,
            price: `$${(seatCount * 150.0 * 1.05).toFixed(2)}`,
            status: "CONFIRMED",
            image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400",
          });
          localStorage.setItem("tkz_bookings", JSON.stringify(savedBookings));
        }
        
        clearActiveAllocation();
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, authToken]);

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col font-sans items-center justify-center ${jakarta.className}`}
      >
        <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
          FETCHING CONFIRMATION SLOTS...
        </span>
      </div>
    );
  }

  const selectedSeats = capturedSeats || activeAllocation?.seatLabels?.join(", ") || "A12, A13";

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAFC] text-gray-900 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12 lg:py-16">
        {/* Success Header */}
        <div className="text-center mb-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 border-4 border-blue-600 rounded-full flex items-center justify-center mb-6"
          >
            <Check size={36} strokeWidth={3} className="text-blue-600" />
          </motion.div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4 uppercase">
            Booking Confirmed
          </h1>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1.5 rounded-md font-mono text-sm font-bold tracking-wide mb-6">
            #{bookingId ? bookingId.substring(0, 8).toUpperCase() : "TKZ-TEMP"}
            <button
              onClick={() => {
                navigator.clipboard.writeText(bookingId);
                alert("Reference ID copied to clipboard!");
              }}
              className="text-blue-500 hover:text-blue-700 transition-colors focus:outline-none"
            >
              <Copy size={16} />
            </button>
          </div>

          <p className="text-gray-600 font-medium">
            Your tickets have been sent to{" "}
            <span className="text-gray-900 font-bold">shvet@example.com</span>
          </p>
        </div>

        {/* The Ticket Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="max-w-[460px] mx-auto w-full bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-l-4 border-blue-600 relative overflow-hidden mb-10"
        >
          {/* Top Section */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Event
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-none uppercase">
                  {eventContext?.title || "LIVE EVENT"}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Type
                </p>
                <span className="bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Standard
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Status
                </p>
                <p className="text-sm font-bold text-green-600 uppercase">
                  {bookingData?.status || "CONFIRMED"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Venue
                </p>
                <p className="text-sm font-bold text-gray-900">
                  {eventContext?.venue || "Live Venue"}
                </p>
              </div>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative h-0 border-t border-dashed border-gray-300 w-full z-10">
            {/* Left and Right cutouts to match background color */}
            <div className="absolute -left-3 -top-3 w-6 h-6 bg-[#F8FAFC] rounded-full shadow-inner"></div>
            <div className="absolute -right-3 -top-3 w-6 h-6 bg-[#F8FAFC] rounded-full shadow-inner"></div>
          </div>

          {/* Bottom Section (QR + Seat Details) */}
          <div className="bg-[#F0F4F8] p-6 sm:p-8 flex flex-col items-center relative">
            {/* QR Code Graphic Placeholder */}
            <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
            {bookingData?.qrCodePayload ? (
                <div className="flex flex-col items-center p-2 border-2 border-gray-200 rounded">
                  {bookingData.qrCodePayload.startsWith("data:image") || bookingData.qrCodePayload.length > 200 ? (
                    // Real Base64 QR code image from backend
                    <img
                      src={`data:image/png;base64,${bookingData.qrCodePayload.replace(/^data:image\/png;base64,/, "")}`}
                      alt="Ticket QR Code"
                      className="w-28 h-28 sm:w-32 sm:h-32"
                    />
                  ) : (
                    // Styled SVG fallback for simulation mode
                    <svg
                      viewBox="0 0 100 100"
                      className="w-28 h-28 sm:w-32 sm:h-32 text-gray-800"
                      fill="currentColor"
                    >
                      <rect x="0" y="0" width="25" height="25" />
                      <rect x="75" y="0" width="25" height="25" />
                      <rect x="0" y="75" width="25" height="25" />
                      <rect x="5" y="5" width="15" height="15" fill="white" />
                      <rect x="80" y="5" width="15" height="15" fill="white" />
                      <rect x="5" y="80" width="15" height="15" fill="white" />
                      <rect x="10" y="10" width="5" height="5" />
                      <rect x="85" y="10" width="5" height="5" />
                      <rect x="10" y="85" width="5" height="5" />
                      <rect x="35" y="0" width="10" height="20" />
                      <rect x="50" y="10" width="20" height="10" />
                      <rect x="35" y="30" width="15" height="15" />
                      <rect x="60" y="35" width="25" height="15" />
                      <rect x="80" y="55" width="20" height="20" />
                      <rect x="50" y="60" width="20" height="20" />
                      <rect x="35" y="80" width="10" height="10" />
                      <rect x="60" y="90" width="25" height="10" />
                      <rect x="15" y="40" width="10" height="25" />
                      <rect x="30" y="55" width="15" height="10" />
                    </svg>
                  )}
                </div>
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gray-200 animate-pulse rounded" />
              )}
            </div>

            <p className="text-[9px] font-bold tracking-widest text-gray-500 uppercase mb-6">
              Scan at venue entrance
            </p>

            {/* Seat Breakdown */}
            <div className="w-full border-t border-gray-200 pt-6 grid grid-cols-3 text-center">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Section
                </p>
                <p className="text-lg font-extrabold text-blue-700">PREM</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Row
                </p>
                <p className="text-lg font-extrabold text-blue-700">Multi</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                  Seats
                </p>
                <p className="text-lg font-extrabold text-blue-700">{selectedSeats}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4 mb-16"
        >
          <Link
            href="/my-bookings"
            className="w-full sm:w-auto bg-[#0D6EFD] text-white px-8 py-3.5 rounded-lg font-bold text-center text-sm tracking-wide hover:bg-blue-700 transition-colors shadow-sm"
          >
            VIEW MY BOOKINGS
          </Link>
          <Link
            href="/events"
            className="w-full sm:w-auto bg-white border border-gray-300 text-gray-800 px-8 py-3.5 rounded-lg font-bold text-center text-sm tracking-wide hover:bg-gray-50 transition-colors shadow-sm"
          >
            EXPLORE MORE EVENTS
          </Link>
        </motion.div>

        {/* What To Expect Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mb-8"
        >
          <h3 className="text-center text-xs font-bold tracking-widest text-gray-600 uppercase mb-8">
            What to expect
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-6 sm:p-8">
              <Clock size={24} className="text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Arrive Early
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Gates open 2 hours before the performance. Security checks may take time.
              </p>
            </div>

            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-6 sm:p-8">
              <Shield size={24} className="text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Carry Valid ID
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                Physical or digital government-issued ID is mandatory for venue entry.
              </p>
            </div>

            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-6 sm:p-8">
              <ShieldAlert size={24} className="text-blue-600 mb-4" />
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                No Refunds
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                All sales are final. Tickets cannot be canceled or modified after purchase.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#EBECEF] border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-extrabold text-lg text-gray-900 tracking-tight">
            <div className="w-2.5 h-2.5 bg-blue-600"></div>
            Ticketizer
          </div>

          <div className="text-center text-xs text-gray-500 font-medium">
            © 2024 Ticketizer. Seats don&apos;t wait.
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-gray-600">
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
