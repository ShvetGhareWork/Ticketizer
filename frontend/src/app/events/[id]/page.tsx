"use client";

import React, { useState, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Zap, Ticket, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

interface MappedEventDetail {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  state: string;
  image: string;
  url: string;
  description: string;
  priceRange: string;
  tags: string[];
}

export default function EventDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [activeTab, setActiveTab] = useState("ABOUT");
  const [eventData, setEventData] = useState<MappedEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowId, setSelectedShowId] = useState<number | null>(null);
  const [scarcityLabel, setScarcityLabel] = useState<string>("AVAILABLE");
  const [scarcityColor, setScarcityColor] = useState<string>(
    "bg-green-600 text-white",
  );

  useEffect(() => {
    if (!id) return;

    const isTicketmasterId = isNaN(Number(id));

    if (!isTicketmasterId) {
      // Mock local event fallback
      setEventData({
        id: id,
        title: "IPL FINAL 2026 — MI VS CSK",
        category: "IPL 2026 FINAL",
        date: "Sun, 24 May 2026",
        time: "07:30 PM",
        venue: "Wankhede Stadium",
        city: "Mumbai",
        state: "",
        image:
          "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1920",
        url: "#",
        description:
          "Witness history in the making as the two titans of the IPL, Mumbai Indians and Chennai Super Kings, face off in the grand finale of the 2026 season. This isn't just a game; it's a battle for supremacy in the cathedral of Indian cricket. Expect high-octane action, strategic masterclasses, and an atmosphere that defies description.",
        priceRange: "₹2,500 - ₹5,000",
        tags: ["CRICKET", "FINALS", "MUMBAI", "EL CLASICO"],
      });
      setLoading(false);
      return;
    }

    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E`,
        );
        if (res.ok) {
          const e = await res.json();
          const image =
            e.images?.reduce((prev: any, curr: any) =>
              prev.width > curr.width ? prev : curr,
            )?.url ||
            e.images?.[0]?.url ||
            "";
          const venue = e._embedded?.venues?.[0]?.name || "US Arena";
          const city = e._embedded?.venues?.[0]?.city?.name || "USA";
          const state = e._embedded?.venues?.[0]?.state?.stateCode || "";
          const description =
            e.info ||
            e.description ||
            `Join us for an unforgettable experience at ${venue}. Feel the energy, enjoy the amazing performance, and make memories that last a lifetime.`;

          setEventData({
            id: e.id,
            title: e.name,
            category:
              e.classifications?.[0]?.segment?.name?.toUpperCase() || "CONCERT",
            date: e.dates?.start?.localDate || "2024-08-24",
            time: e.dates?.start?.localTime || "19:30",
            venue: venue,
            city: city,
            state: state,
            image: image,
            url: e.url,
            description: description,
            priceRange: e.priceRanges?.[0]?.min
              ? `£${e.priceRanges[0].min} - £${e.priceRanges[0].max || e.priceRanges[0].min + 50}`
              : "£45.00 - £120.00",
            tags: [
              e.classifications?.[0]?.segment?.name?.toUpperCase() ||
                "LIVE EVENT",
              e.classifications?.[0]?.genre?.name?.toUpperCase() ||
                "TICKETMASTER",
              city.toUpperCase(),
            ],
          });
        }
      } catch (err) {
        console.error("Failed to load event details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    if (!eventData) return;
    const lowerVenue = eventData.venue.toLowerCase();
    const isSphere = lowerVenue.includes("sphere");
    const isTheater =
      lowerVenue.includes("theater") ||
      lowerVenue.includes("comedy") ||
      lowerVenue.includes("club");
    const showId = isSphere ? 2 : isTheater ? 3 : 1;

    const fetchScarcity = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/v1/reservations/show/${showId}/seats`,
        );
        if (res.ok) {
          const data = await res.json();
          const availableCount = data.filter(
            (s: any) => s.status === "AVAILABLE",
          ).length;
          const totalCount =
            data.length || (isSphere ? 180 : isTheater ? 72 : 336);

          if (availableCount === 0) {
            setScarcityLabel("SOLD OUT");
            setScarcityColor("bg-gray-500 text-white");
          } else if (availableCount < 20) {
            setScarcityLabel(`${availableCount} SEATS LEFT`);
            setScarcityColor("bg-red-600 text-white");
          } else if (availableCount <= totalCount / 2) {
            setScarcityLabel("FAST FILLING");
            setScarcityColor("bg-amber-600 text-white");
          } else {
            setScarcityLabel("AVAILABLE");
            setScarcityColor("bg-green-600 text-white");
          }
        }
      } catch (err) {
        // Fallback default states if backend is offline
        const mockAvailable = isSphere ? 90 : isTheater ? 45 : 10;
        const totalCount = isSphere ? 180 : isTheater ? 72 : 336;
        if (mockAvailable < 20) {
          setScarcityLabel(`${mockAvailable} SEATS LEFT`);
          setScarcityColor("bg-red-600 text-white");
        } else if (mockAvailable <= totalCount / 2) {
          setScarcityLabel("FAST FILLING");
          setScarcityColor("bg-amber-600 text-white");
        } else {
          setScarcityLabel("AVAILABLE");
          setScarcityColor("bg-green-600 text-white");
        }
      }
    };
    fetchScarcity();
  }, [eventData]);

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans items-center justify-center ${jakarta.className}`}
      >
        <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
        <span className="text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest text-center px-4">
          FETCHING EVENT INFORMATION...
        </span>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div
        className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans items-center justify-center px-4 ${jakarta.className}`}
      >
        <span className="text-base sm:text-lg font-extrabold text-gray-700 mb-4 uppercase text-center">
          Event Not Found
        </span>
        <Link
          href="/events"
          className="bg-blue-600 text-white px-6 py-3 sm:py-2.5 rounded font-bold hover:bg-blue-700 transition-colors shadow-sm text-sm w-full sm:w-auto text-center"
        >
          Return to Events
        </Link>
      </div>
    );
  }

  const isSphere = eventData.venue.toLowerCase().includes("sphere");
  const isTheater =
    eventData.venue.toLowerCase().includes("theater") ||
    eventData.venue.toLowerCase().includes("comedy") ||
    eventData.venue.toLowerCase().includes("club");

  const selectedShow = isSphere
    ? {
        id: 2,
        date: eventData.date,
        time: eventData.time,
        location: eventData.city.toUpperCase(),
        price: eventData.priceRange.split(" - ")[0],
        scarcityLabel: scarcityLabel,
        scarcityColor: scarcityColor,
      }
    : isTheater
      ? {
          id: 3,
          date: eventData.date,
          time: eventData.time,
          location: eventData.city.toUpperCase(),
          price: eventData.priceRange.split(" - ")[0],
          scarcityLabel: scarcityLabel,
          scarcityColor: scarcityColor,
        }
      : {
          id: 1, // Default Stadium
          date: eventData.date,
          time: eventData.time,
          location: eventData.city.toUpperCase(),
          price: eventData.priceRange.split(" - ")[0],
          scarcityLabel: scarcityLabel,
          scarcityColor: scarcityColor,
        };

  const shows = [selectedShow];

  return (
    <div
      className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col font-sans ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* HERO BANNER */}
      <section className="relative w-full h-[360px] sm:h-[400px] lg:h-[480px] bg-blue-900 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={eventData.image}
            alt={eventData.title}
            className="w-full h-full object-cover mix-blend-overlay opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/30 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/60 lg:from-blue-600/40 to-transparent"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-12 pb-6 sm:pb-8 lg:pb-12 z-10 flex flex-col">
          <span className="self-start bg-[#0052CC] text-white text-[10px] sm:text-xs font-bold tracking-widest px-3 py-1.5 rounded-sm uppercase mb-3 sm:mb-4 shadow-sm">
            {eventData.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-3 lg:mb-4 line-clamp-3 sm:line-clamp-2">
            {eventData.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-xl sm:text-2xl font-mono font-bold text-blue-700">
              {eventData.priceRange}
            </span>
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-full shadow-sm inline-block self-start sm:self-auto">
              • {eventData.venue}, {eventData.city} {eventData.state}
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA (SPLIT LAYOUT) */}
      <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: TABS & CONTENT (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col order-2 lg:order-1">
            {/* Tab Navigation - Enabled smooth touch scrolling */}
            <div className="flex gap-6 sm:gap-8 border-b border-gray-200 mb-6 sm:mb-8 overflow-x-auto no-scrollbar touch-pan-x">
              {["ABOUT", "LINEUP", "VENUE", "REVIEWS"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 pt-2 text-xs sm:text-sm font-bold tracking-widest uppercase whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content Rendering */}
            {activeTab === "ABOUT" && (
              <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
                {/* Description Block */}
                <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6 lg:p-8">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
                    EVENT DETAILS
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed font-medium">
                    {eventData.description}
                  </p>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6">
                    <Zap size={20} className="text-blue-600 mb-3" />
                    <h3 className="text-[11px] sm:text-xs font-bold tracking-widest text-gray-900 uppercase mb-2">
                      Official Seating
                    </h3>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      Secured tickets directly from Ticketmaster inventory with
                      instant allocation.
                    </p>
                  </div>
                  <div className="bg-[#F0F4F8] border border-gray-200 rounded-xl p-5 sm:p-6">
                    <Ticket size={20} className="text-blue-600 mb-3" />
                    <h3 className="text-[11px] sm:text-xs font-bold tracking-widest text-gray-900 uppercase mb-2">
                      Digital Pass
                    </h3>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      100% contactless access via the virtual Ticketizer system.
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {eventData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#EBECEF] text-gray-700 text-[9px] sm:text-[10px] lg:text-xs font-bold tracking-widest px-3 py-1.5 rounded-full uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {activeTab !== "ABOUT" && (
              <div className="h-40 sm:h-48 flex items-center justify-center bg-[#F0F4F8] border border-gray-200 rounded-xl animate-in fade-in duration-300">
                <p className="text-gray-500 font-bold tracking-widest uppercase text-xs sm:text-sm">
                  {activeTab} Content Placeholder
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: TICKET SELECTION (4 cols, Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 relative order-1 lg:order-2">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Show Selection Container */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm">
                <h3 className="text-[10px] sm:text-[11px] font-bold tracking-widest text-gray-500 uppercase flex items-center gap-2 mb-4 sm:mb-5">
                  <div className="w-1.5 h-4 bg-blue-600"></div>
                  Select a Show
                </h3>

                {/* Show Cards List */}
                <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
                  {shows.map((show) => (
                    <div
                      key={show.id}
                      onClick={() => setSelectedShowId(show.id)}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedShowId === show.id
                          ? "border-blue-600 bg-blue-50/30"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div>
                          <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">
                            {show.date}
                          </h4>
                          <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold tracking-widest text-gray-500 uppercase mt-1">
                            {show.time} • {show.location}
                          </p>
                        </div>
                        <span
                          className={`${show.scarcityColor} text-[9px] sm:text-[10px] font-extrabold tracking-widest px-2 py-1 rounded-sm uppercase`}
                        >
                          {show.scarcityLabel}
                        </span>
                      </div>

                      <div className="flex justify-between items-center border-t border-gray-100/50 pt-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-base sm:text-lg lg:text-xl font-bold font-mono text-blue-700">
                            {show.price}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">
                            starts at
                          </span>
                        </div>
                        <ArrowRight size={18} className="text-blue-600" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main CTA - Enforced touch target min-height */}
                {selectedShowId !== null ? (
                  <Link
                    href={`/events/${id}/shows/${selectedShowId}/seats`}
                    onClick={() => {
                      if (eventData) {
                        sessionStorage.setItem(
                          "currentEvent",
                          JSON.stringify({
                            id: eventData.id,
                            title: eventData.title,
                            venue: eventData.venue,
                            city: eventData.city,
                            image: eventData.image,
                            date:
                              shows.find((s) => s.id === selectedShowId)
                                ?.date || eventData.date,
                            time:
                              shows.find((s) => s.id === selectedShowId)
                                ?.time || eventData.time,
                          }),
                        );
                      }
                    }}
                    className="w-full min-h-[48px] bg-[#0D6EFD] text-white py-3 sm:py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    Select Seats <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full min-h-[48px] bg-gray-200 text-gray-400 py-3 sm:py-3.5 rounded-lg font-bold text-xs sm:text-sm tracking-widest uppercase cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
                  >
                    Select Seats <ArrowRight size={16} />
                  </button>
                )}
              </div>

              {/* Warning Banner */}
              <div className="bg-[#FFE5E5] border border-[#FFCCCC] text-[#D32F2F] rounded-lg p-3 sm:p-4 flex items-start sm:items-center gap-3">
                <AlertTriangle
                  size={18}
                  className="flex-shrink-0 mt-0.5 sm:mt-0"
                />
                <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold tracking-widest uppercase leading-tight">
                  Seats don&apos;t wait. High demand for this event.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F0F4F8] border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center md:text-left">
            <h2 className="font-extrabold text-lg sm:text-xl text-blue-900 mb-1 tracking-tight">
              Ticketizer
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
              © 2026 Ticketizer. All seats are final.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] font-bold tracking-widest text-gray-600 uppercase">
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

      {/* Hide Scrollbar for tabs */}
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
