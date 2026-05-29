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
  const [customBookings, setCustomBookings] = useState<any[]>([]);

  const isRealBooking = (id: string) => /^[0-9a-f-,%]+$/i.test(id);

  useEffect(() => {
    const saved = localStorage.getItem("tkz_bookings");
    if (saved) {
      const parsedBookings = JSON.parse(saved).map((b: any) => {
        if (
          b &&
          (b.title === "Live Event Booking" || b.venue === "Venue TBA")
        ) {
          b.title = "Inception (Re-Release)";
          b.date = "Monday, June 1, 2026 • 6:00 PM";
          b.venue = "Narendra Modi Stadium, Ahmedabad";
          b.status = "CONFIRMED";
          b.image =
            "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400";
        }
        return b;
      });
      setCustomBookings(parsedBookings); // Immediate load from cache for fast UX

      const reloadBookings = async () => {
        try {
          const promises = parsedBookings.map(async (b: any) => {
            if (!b || !b.id) return b;

            if (!isRealBooking(b.id)) {
              if (b.title === "Live Event Booking" || b.venue === "Venue TBA") {
                b.title = "Inception (Re-Release)";
                b.date = "Monday, June 1, 2026 • 6:00 PM";
                b.venue = "Narendra Modi Stadium, Ahmedabad";
                b.status = "CONFIRMED";
                b.image =
                  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400";
              }
              return b;
            }

            try {
              const refs = b.id.split(",");
              const fetchPromises = refs.map((ref: string) =>
                fetch(`http://localhost:8080/api/v1/bookings/${ref}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
                  },
                })
                  .then(async (res) => {
                    if (res.ok) {
                      const data = await res.json();
                      if (data && data.eventTitle) return data;
                    }
                    return null;
                  })
                  .catch(() => null),
              );

              const results = await Promise.all(fetchPromises);
              const validResults = results.filter(Boolean);

              if (validResults.length > 0) {
                const firstValid = validResults[0];
                const allConfirmed = validResults.every(
                  (data) => data.status === "CONFIRMED",
                );
                const anyCancelled = validResults.some(
                  (data) =>
                    data.status === "CANCELLED" || data.status === "EXPIRED",
                );
                const status = allConfirmed
                  ? "CONFIRMED"
                  : anyCancelled
                    ? "CANCELLED"
                    : "PENDING";

                const totalPrice = validResults.reduce(
                  (sum, r) => sum + (r.price || 150.0),
                  0,
                );
                const seatNumbers = validResults
                  .map((r) => r.seatNumber)
                  .join(", ");

                let dateStr = firstValid.startTime || b.date;
                if (firstValid.startTime) {
                  try {
                    const d = new Date(firstValid.startTime);
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
                }

                let finalImage = firstValid.imageUrl || b.image;
                if (
                  !finalImage ||
                  finalImage.includes("photo-1540747913346-19e32dc3e97e")
                ) {
                  const titleLower = (
                    firstValid.eventTitle ||
                    b.title ||
                    ""
                  ).toLowerCase();
                  if (titleLower.includes("imagine dragons")) {
                    finalImage =
                      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400";
                  } else if (titleLower.includes("eagles")) {
                    finalImage =
                      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=400";
                  } else if (
                    titleLower.includes("miracles") ||
                    titleLower.includes("spinners")
                  ) {
                    finalImage =
                      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400";
                  } else if (
                    firstValid.venue?.toLowerCase().includes("sphere")
                  ) {
                    finalImage =
                      "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=400";
                  } else if (
                    firstValid.venue?.toLowerCase().includes("theater") ||
                    firstValid.venue?.toLowerCase().includes("comedy")
                  ) {
                    finalImage =
                      "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&q=80&w=400";
                  } else {
                    finalImage =
                      "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=400";
                  }
                }

                return {
                  id: b.id,
                  title: firstValid.eventTitle || b.title,
                  date: dateStr,
                  venue: firstValid.venue || b.venue,
                  seats: `${seatNumbers} · Standard`,
                  price: `$${(totalPrice * 1.05).toFixed(2)}`,
                  status: status,
                  image: finalImage,
                };
              }
            } catch (err) {
              console.warn(
                `Failed to reload booking details for ${b.id}:`,
                err,
              );
            }

            if (
              b &&
              (b.title === "Live Event Booking" || b.venue === "Venue TBA")
            ) {
              b.title = "Inception (Re-Release)";
              b.date = "Monday, June 1, 2026 • 6:00 PM";
              b.venue = "Narendra Modi Stadium, Ahmedabad";
              b.status = "CONFIRMED";
              b.image =
                "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400";
            }
            return b;
          });

          const enriched = await Promise.all(promises);
          setCustomBookings(enriched);
          localStorage.setItem("tkz_bookings", JSON.stringify(enriched));
        } catch (e) {
          console.error("Failed to enrich bookings", e);
        }
      };

      reloadBookings();
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
          <button className="text-blue-600 border-b-2 border-blue-600 pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap">
            Upcoming
          </button>
          <button className="text-gray-500 hover:text-gray-900 pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap">
            Past
          </button>
          <button className="text-gray-500 hover:text-gray-900 pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap">
            Cancelled
          </button>
        </div>

        {/* Bookings List */}
        <div className="space-y-4 sm:space-y-6">
          {bookings.map((booking) => (
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

              {/* Action Area (Status, Price, View Ticket) */}
              <div className="md:w-[140px] lg:w-[180px] flex flex-row md:flex-col justify-between items-center md:items-end flex-shrink-0 py-1">
                <div className="flex md:flex-col justify-between md:items-end items-center w-auto gap-3 md:gap-2">
                  <span className="bg-[#1860D4] text-white text-[8px] sm:text-[9px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider">
                    {booking.status}
                  </span>
                  <span className="text-blue-700 font-medium text-base sm:text-lg md:mt-1">
                    {booking.price}
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (isRealBooking(booking.id)) {
                      router.push(`/booking/${booking.id}/confirmation`);
                    } else {
                      alert(
                        `Booking Reference: ${booking.id}\nStatus: ${booking.status}`,
                      );
                    }
                  }}
                  className="text-[10px] sm:text-[11px] font-bold tracking-widest text-blue-600 uppercase flex items-center justify-center gap-1.5 hover:text-blue-800 transition-colors group-hover:translate-x-1 duration-300 min-h-[44px] md:min-h-0 px-2 sm:px-0"
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
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Help
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Contact
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Terms
            </Link>
            <Link
              href="#"
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
