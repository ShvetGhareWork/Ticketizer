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
  seatNumber?: string;
  price?: number;
  eventTitle?: string;
  venue?: string;
  startTime?: string;
}

export default function BookingConfirmationPage() {
  const params = useParams();
  const bookingId = params?.bookingId as string;

  const { authToken, activeAllocation, clearActiveAllocation, addLog } =
    useApp();

  const [bookingsData, setBookingsData] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  // Capture seat labels at time of render before clearActiveAllocation() wipes them
  const [capturedSeats, setCapturedSeats] = useState<string>(
    activeAllocation?.seatLabels?.join(", ") ||
      activeAllocation?.seatLabel ||
      "",
  );
  // Pull event context stored in sessionStorage from the event detail page
  const [eventContext, setEventContext] = useState<{
    title: string;
    date: string;
    venue: string;
    city: string;
    time?: string;
    image?: string;
  } | null>(null);
  const [userEmail, setUserEmail] = useState<string>("shvet@example.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      let email = localStorage.getItem("userEmail");

      const token = authToken || localStorage.getItem("authToken");
      if (token) {
        try {
          if (
            token.startsWith("simulated-token-") ||
            token.startsWith("google-token-")
          ) {
            const base64Part = token.split("-").pop() || "";
            const decodedEmail = window.atob(base64Part);
            if (decodedEmail && decodedEmail.includes("@")) {
              email = decodedEmail;
            }
          } else {
            const base64Url = token.split(".")[1];
            const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(window.atob(base64));
            if (payload && payload.email) {
              email = payload.email;
            }
          }
        } catch (e) {
          console.error("Failed to decode token for email", e);
        }
      }

      if (email) {
        setUserEmail(email);
      }
    }
  }, [authToken]);

  useEffect(() => {
    if (!bookingId) return;

    // Capture current seat labels before async work starts
    const currentSeats =
      activeAllocation?.seatLabels?.join(", ") ||
      activeAllocation?.seatLabel ||
      "A12";
    if (!capturedSeats && currentSeats) setCapturedSeats(currentSeats);

    // Load event context from sessionStorage
    try {
      const stored = sessionStorage.getItem("currentEvent");
      if (stored) {
        setEventContext(JSON.parse(stored));
      }
    } catch (e) {
      /* ignore */
    }

    const fetchBookingDetails = async () => {
      setLoading(true);
      const decodedBookingId = decodeURIComponent(
        decodeURIComponent(bookingId),
      );
      const refs = decodedBookingId
        .split(/,|%2C/)
        .map((r) => r.trim())
        .filter(Boolean);

      try {
        const promises = refs.map(async (ref, idx) => {
          try {
            const response = await fetch(
              `http://localhost:8080/api/v1/bookings/${ref}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken || localStorage.getItem("authToken") || ""}`,
                },
              },
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.eventTitle) {
                return data;
              }
            }
          } catch (err) {
            console.error("Failed to load booking details for", ref, err);
          }

          const seatLabelsList = capturedSeats
            ? capturedSeats.split(", ").filter(Boolean)
            : activeAllocation?.seatLabels || ["A12"];
          const seatLabel = seatLabelsList[idx] || seatLabelsList[0] || "A12";
          return {
            bookingReference: ref,
            status: "CONFIRMED",
            qrCodePayload: `TKZ::${ref.substring(0, 8)}`,
            seatNumber: seatLabel,
            price: 150.0,
            eventTitle: eventContext?.title || "Live Event Booking",
            venue: eventContext
              ? `${eventContext.venue}, ${eventContext.city}`
              : "Venue TBA",
            startTime: eventContext?.date || "Upcoming",
          };
        });

        const results = await Promise.all(promises);
        setBookingsData(results);
        addLog(
          "SUCCESS",
          `GATEWAY LOADED: Synced details for ${results.length} seat allocation(s).`,
        );

        const eventTitle = eventContext?.title || "Live Event Booking";
        const eventDate = eventContext?.date
          ? `${eventContext.date} • ${eventContext?.time || ""}`.trim()
          : "Upcoming";
        const eventVenue = eventContext
          ? `${eventContext.venue}, ${eventContext.city}`
          : "Venue TBA";

        const savedBookings = JSON.parse(
          localStorage.getItem("tkz_bookings") || "[]",
        );

        // Combine all results into a single booking card
        const exists = savedBookings.some((b: any) => b.id === bookingId);
        if (!exists && results.length > 0) {
          const seatLabelsList = capturedSeats
            ? capturedSeats.split(", ").filter(Boolean)
            : activeAllocation?.seatLabels || ["A12"];
          const formattedSeats = seatLabelsList.join(", ");
          const totalPrice = results.reduce(
            (sum, r) => sum + (r.price || 150.0),
            0,
          );

          savedBookings.unshift({
            id: bookingId, // Use the comma-separated list of references as the single transaction ID
            title: results[0].eventTitle || eventTitle,
            date: results[0].startTime || eventDate,
            venue: results[0].venue || eventVenue,
            seats: `${formattedSeats} · Standard`,
            price: `$${(totalPrice * 1.05).toFixed(2)}`,
            status: "CONFIRMED",
            image:
              eventContext?.image ||
              "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400",
          });
        }
        localStorage.setItem("tkz_bookings", JSON.stringify(savedBookings));
        clearActiveAllocation();
      } catch (err) {
        console.error("Relational gateway failed.", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, authToken]);

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col font-sans items-center justify-center px-4 ${jakarta.className}`}
      >
        <span className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
        <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest text-center">
          FETCHING CONFIRMATION SLOTS...
        </span>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#F8FAFC] text-gray-900 ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        {/* Success Header */}
        <div className="text-center mb-8 sm:mb-10 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-blue-50 border-4 border-blue-600 rounded-full flex items-center justify-center mb-4 sm:mb-6"
          >
            <Check
              className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600"
              strokeWidth={3}
            />
          </motion.div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight mb-3 sm:mb-4 uppercase">
            Booking Confirmed
          </h1>

          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-3 sm:px-4 py-1.5 rounded-md font-mono text-xs sm:text-sm font-bold tracking-wide mb-4 sm:mb-6 max-w-full">
            <span className="truncate">
              #
              {bookingId ? bookingId.substring(0, 8).toUpperCase() : "TKZ-TEMP"}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(bookingId);
                alert("Reference ID copied to clipboard!");
              }}
              className="text-blue-500 hover:text-blue-700 transition-colors focus:outline-none p-2 -mr-2"
            >
              <Copy size={16} />
            </button>
          </div>

          <p className="text-sm sm:text-base text-gray-600 font-medium px-4">
            Your tickets have been sent to{" "}
            <span className="text-gray-900 font-bold break-all">
              {userEmail}
            </span>
          </p>
        </div>

        {/* Render a consolidated ticket card enlisting all seats! */}
        <div className="flex flex-col gap-6 sm:gap-8 max-w-[460px] mx-auto w-full mb-8 sm:mb-10">
          {bookingsData.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-l-4 border-blue-600 relative overflow-hidden"
            >
              {/* Top Section */}
              <div className="p-5 sm:p-8">
                <div className="flex justify-between items-start mb-5 sm:mb-6 gap-2">
                  <div className="flex-1">
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                      Event
                    </p>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight uppercase line-clamp-3 sm:line-clamp-2">
                      {bookingsData[0].eventTitle ||
                        eventContext?.title ||
                        "LIVE EVENT"}
                    </h2>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                      Type
                    </p>
                    <span className="bg-blue-600 text-white text-[9px] sm:text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Standard
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                      Status
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-green-600 uppercase">
                      {bookingsData.every((b) => b.status === "CONFIRMED")
                        ? "CONFIRMED"
                        : "PENDING"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                      Venue
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2">
                      {bookingsData[0].venue ||
                        eventContext?.venue ||
                        "Live Venue"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-100">
                  <p className="text-[9px] sm:text-[10px] font-bold tracking-widest text-gray-500 uppercase mb-1">
                    Enlisted Seats ({bookingsData.length})
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-blue-700 break-words">
                    {bookingsData
                      .map((data, idx) => {
                        const seatLabelsList = capturedSeats
                          ? capturedSeats.split(", ").filter(Boolean)
                          : ["A12"];
                        return data.seatNumber || seatLabelsList[idx] || "A12";
                      })
                      .join(", ")}
                  </p>
                </div>
              </div>

              {/* Perforated Divider */}
              <div className="relative h-0 border-t border-dashed border-gray-300 w-full z-10">
                <div className="absolute -left-3 -top-3 w-6 h-6 bg-[#F8FAFC] rounded-full shadow-inner"></div>
                <div className="absolute -right-3 -top-3 w-6 h-6 bg-[#F8FAFC] rounded-full shadow-inner"></div>
              </div>

              {/* Bottom Section (QRs for each seat) */}
              <div className="bg-[#F0F4F8] p-5 sm:p-8 flex flex-col items-center gap-5 sm:gap-6 relative">
                {bookingsData.map((data, index) => {
                  const seatLabelsList = capturedSeats
                    ? capturedSeats.split(", ").filter(Boolean)
                    : ["A12"];
                  const seatLabel =
                    data.seatNumber || seatLabelsList[index] || "A12";

                  return (
                    <div
                      key={data.bookingReference}
                      className="flex flex-col items-center bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 w-full max-w-[240px] sm:max-w-[280px]"
                    >
                      <span className="text-[10px] sm:text-[11px] font-extrabold text-blue-700 tracking-widest uppercase mb-2">
                        SEAT {seatLabel}
                      </span>
                      <div className="bg-white p-1 rounded border border-gray-200">
                        {data.qrCodePayload ? (
                          data.qrCodePayload.startsWith("data:image") ||
                          data.qrCodePayload.length > 200 ? (
                            <img
                              src={`data:image/png;base64,${data.qrCodePayload.replace(/^data:image\/png;base64,/, "")}`}
                              alt={`Seat ${seatLabel} QR`}
                              className="w-24 h-24 sm:w-32 sm:h-32"
                            />
                          ) : (
                            <svg
                              viewBox="0 0 100 100"
                              className="w-24 h-24 sm:w-32 sm:h-32 text-gray-800"
                              fill="currentColor"
                            >
                              <rect x="0" y="0" width="25" height="25" />
                              <rect x="75" y="0" width="25" height="25" />
                              <rect x="0" y="75" width="25" height="25" />
                              <rect
                                x="5"
                                y="5"
                                width="15"
                                height="15"
                                fill="white"
                              />
                              <rect
                                x="80"
                                y="5"
                                width="15"
                                height="15"
                                fill="white"
                              />
                              <rect
                                x="5"
                                y="80"
                                width="15"
                                height="15"
                                fill="white"
                              />
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
                          )
                        ) : (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 animate-pulse rounded" />
                        )}
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-gray-400 uppercase mt-2">
                        Scan at entrance
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
        >
          <Link
            href="/my-bookings"
            className="w-full sm:w-auto min-h-[48px] flex items-center justify-center bg-[#0D6EFD] text-white px-6 sm:px-8 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wide hover:bg-blue-700 transition-colors shadow-sm"
          >
            VIEW MY BOOKINGS
          </Link>
          <Link
            href="/events"
            className="w-full sm:w-auto min-h-[48px] flex items-center justify-center bg-white border border-gray-300 text-gray-800 px-6 sm:px-8 py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-wide hover:bg-gray-50 transition-colors shadow-sm"
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
          <h3 className="text-center text-[11px] sm:text-xs font-bold tracking-widest text-gray-600 uppercase mb-6 sm:mb-8">
            What to expect
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6 lg:p-8">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Arrive Early
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                Gates open 2 hours before the performance. Security checks may
                take time.
              </p>
            </div>

            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6 lg:p-8">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Carry Valid ID
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                Physical or digital government-issued ID is mandatory for venue
                entry.
              </p>
            </div>

            <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6 lg:p-8">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-3 sm:mb-4" />
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                No Refunds
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                All sales are final. Tickets cannot be canceled or modified
                after purchase.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#EBECEF] border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-2 font-extrabold text-base sm:text-lg text-gray-900 tracking-tight">
            <div className="w-2.5 h-2.5 bg-blue-600"></div>
            Ticketizer
          </div>

          <div className="text-center text-[10px] sm:text-xs text-gray-500 font-medium">
            © 2026 Ticketizer. Seats don&apos;t wait.
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs font-semibold text-gray-600">
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Help
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              About
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
