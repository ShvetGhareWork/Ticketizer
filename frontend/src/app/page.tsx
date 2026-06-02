"use client";

import React, { useState, useEffect } from "react";
import { Search, ArrowRight, Share2, Bell } from "lucide-react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Initialize the premium, extensive font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function TicketizerLanding() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketDeck, setTicketDeck] = useState<any[]>([]);

  useEffect(() => {
    const fetchHomeEvents = async () => {
      setLoading(true);
      try {
        const urls = [
          "https://app.ticketmaster.com/discovery/v2/events.json?attractionId=K8vZ917Gku7&countryCode=CA&apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E",
          "https://app.ticketmaster.com/discovery/v2/events.json?keyword=devjam&source=universe&countryCode=US&apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E",
          "https://app.ticketmaster.com/discovery/v2/events.json?classificationName=music&dmaId=324&apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E",
          "https://app.ticketmaster.com/discovery/v2/events.json?countryCode=US&apikey=4GuIsc99bX5H6BRpf4FPyAcqsoIrBO1E",
        ];

        const results = await Promise.all(
          urls.map((url) =>
            fetch(url)
              .then((res) => (res.ok ? res.json() : null))
              .catch(() => null),
          ),
        );

        let combinedRaw: any[] = [];
        results.forEach((data) => {
          if (data && data._embedded?.events) {
            combinedRaw = [...combinedRaw, ...data._embedded.events];
          }
        });

        // Deduplicate events by ID
        const uniqueEventsMap = new Map();
        combinedRaw.forEach((e) => {
          if (e && e.id && !uniqueEventsMap.has(e.id)) {
            uniqueEventsMap.set(e.id, e);
          }
        });

        const uniqueRaw = Array.from(uniqueEventsMap.values()).slice(0, 9);

        let mapped = uniqueRaw.map((e, index) => {
          const image =
            e.images?.reduce((prev: any, curr: any) =>
              prev.width > curr.width ? prev : curr,
            )?.url ||
            e.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=800";
          const venue = e._embedded?.venues?.[0]?.name || "Arena";
          const city = e._embedded?.venues?.[0]?.city?.name || "City";

          let tag = "LIVE SALE";
          let tagColor = "bg-white text-gray-900";
          if (index % 3 === 1) {
            tag = "FAST FILLING";
            tagColor = "bg-blue-600 text-white";
          } else if (index % 3 === 2) {
            tag = "EXCLUSIVE";
            tagColor = "bg-amber-500 text-gray-900";
          }

          const localDate = e.dates?.start?.localDate || "2026-08-20";
          const formattedDate =
            new Date(localDate)
              .toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              .toUpperCase() + ` — ${city.toUpperCase()}`;

          const price = e.priceRanges?.[0]?.min
            ? `From £${e.priceRanges[0].min}`
            : `From £${Math.floor(Math.random() * 50) + 30}`;

          return {
            id: e.id,
            tag,
            tagColor,
            image,
            date: formattedDate,
            title: e.name,
            price,
            venue: `${venue}, ${city}`,
          };
        });

        // Safe Fallback curated stunning local events if Ticketmaster API blocked or limited
        if (mapped.length === 0) {
          mapped = [
            {
              id: "1",
              tag: "LIVE SALE",
              tagColor: "bg-white text-gray-900",
              image: "https://images.unsplash.com/photo-1540039155732-684736dd6d54?auto=format&fit=crop&q=80&w=800",
              date: "JUN 1, 2026 — AHMEDABAD",
              title: "Inception (Re-Release) - Main Pitch Area",
              price: "From £150.00",
              venue: "Narendra Modi Stadium, Ahmedabad",
            },
            {
              id: "2",
              tag: "FAST FILLING",
              tagColor: "bg-blue-600 text-white",
              image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
              date: "JUN 1, 2026 — LAS VEGAS",
              title: "Inception (Re-Release) - Immersive Dome",
              price: "From £250.00",
              venue: "Las Vegas Sphere, Las Vegas",
            },
            {
              id: "3",
              tag: "EXCLUSIVE",
              tagColor: "bg-amber-500 text-gray-900",
              image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
              date: "JUN 2, 2026 — BANGALORE",
              title: "Inception (Re-Release) - Intimate Lounge",
              price: "From £80.00",
              venue: "Comedy Club Theater, Bangalore",
            },
            {
              id: "4",
              tag: "LIVE SALE",
              tagColor: "bg-white text-gray-900",
              image: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=800",
              date: "OCT 12, 2026 — GOA",
              title: "Sunburn Festival Goa 2026",
              price: "From £120.00",
              venue: "Vagator Beach, Goa",
            },
            {
              id: "5",
              tag: "FAST FILLING",
              tagColor: "bg-blue-600 text-white",
              image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800",
              date: "DEC 24, 2026 — MUMBAI",
              title: "Diljit Dosanjh: Dil-Luminati Tour",
              price: "From £90.00",
              venue: "DY Patil Stadium, Mumbai",
            },
            {
              id: "6",
              tag: "EXCLUSIVE",
              tagColor: "bg-amber-500 text-gray-900",
              image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
              date: "NOV 18, 2026 — MUMBAI",
              title: "Coldplay: Music of the Spheres Tour",
              price: "From £180.00",
              venue: "Wankhede Stadium, Mumbai",
            }
          ];
        }

        if (mapped.length > 0) {
          setEvents(mapped);

          // Populate the interactive ticket deck with the top 3 live events
          const deckItems = mapped.slice(0, 3).map((e, idx) => ({
            id: e.id,
            title: e.title,
            venue: e.venue,
            price: e.price,
            tag: idx === 0 ? "LIVE" : idx === 1 ? "FAST" : "NEW",
            code: `#TKZ-${Math.floor(Math.random() * 90) + 10}`,
          }));
          setTicketDeck(deckItems);
        }
      } catch (err) {
        console.error("Failed to fetch home events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeEvents();
  }, []);

  const categories = [
    "All Events",
    "Cricket",
    "Concerts",
    "Comedy",
    "Football",
    "Theatre",
    "Festivals",
  ];

  // Function to cycle the top card to the back of the deck
  const cycleCardToBack = () => {
    setTicketDeck((prev) => {
      if (prev.length === 0) return prev;
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
    return `/events/${ticketId}`;
  };

  return (
    <div
      className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col overflow-x-hidden ${jakarta.className}`}
    >
      {/* NAVBAR */}
      <Header />

      {/* HERO SECTION */}
      <section className="relative flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12 lg:py-24 overflow-hidden border-b border-gray-200">
        {/* Faint Grid Background Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40 z-0"
          style={{
            backgroundImage:
              "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
          {/* Left Column: Typography & Search */}
          <div className="flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-0">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 bg-blue-600"></span>
              Live Now — 3 events on sale
            </div>

            {/* Responsive Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-[5rem] font-extrabold tracking-tight leading-[1.1] text-gray-900">
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
              className="mt-4 flex flex-col sm:flex-row w-full max-w-xl border border-gray-200 bg-white rounded shadow-sm focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all"
            >
              <div className="hidden sm:flex items-center pl-4 text-gray-400">
                <Search size={20} />
              </div>
              <input
                type="text"
                placeholder="Search artist, team or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-4 px-4 sm:px-3 outline-none text-gray-900 placeholder-gray-400 font-medium bg-transparent text-base"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-4 font-bold tracking-wide hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer min-h-[56px]"
              >
                SEARCH <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Right Column: Animated Card Stack */}
          <div className="flex justify-center lg:justify-end relative h-[360px] sm:h-[400px] lg:h-[500px] items-center mt-8 lg:mt-0">
            {/* Background decorative 'B' */}
            <div className="absolute inset-y-0 right-0 w-full lg:w-3/4 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <span className="text-[140px] sm:text-[180px] lg:text-[240px] font-black leading-none transform lg:rotate-90 origin-center text-gray-900">
                BOOK
              </span>
            </div>

            {/* Interactive Ticket Stack - Fluid bounds for mobile */}
            <div className="relative w-[85vw] max-w-xs sm:w-72 lg:w-80 h-64 sm:h-72 z-10 mr-4 sm:mr-8 lg:mr-0">
              {ticketDeck.map((ticket, index) => {
                const isTopCard = index === 0;
                const targetUrl = getTicketTargetUrl(ticket.id);
                return (
                  <motion.div
                    key={ticket.id}
                    layout // Smooth reordering animations
                    initial={false}
                    animate={{
                      top: index * 12,
                      right: index * -12, // Reduced spread to prevent mobile viewport clipping
                      scale: 1 - index * 0.05,
                      rotate: isTopCard ? -3 : index * 2,
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
                    <h3 className="font-extrabold text-lg sm:text-xl lg:text-2xl mb-1 text-gray-900 tracking-tight line-clamp-2">
                      {ticket.title}
                    </h3>
                    <p className="text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8 font-medium truncate">
                      {ticket.venue}
                    </p>

                    <div className="flex justify-between items-center border-t border-gray-100 pt-4 sm:pt-6">
                      <span className="text-blue-600 font-bold text-base sm:text-lg">
                        {ticket.price}
                      </span>

                      <Link
                        href={targetUrl}
                        onClick={(e) => e.stopPropagation()}
                        className="w-10 h-10 bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors rounded-sm shadow-md hover:shadow-lg z-20"
                      >
                        <ArrowRight size={18} />
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
      <div className="bg-blue-600 text-white py-3 overflow-hidden whitespace-nowrap flex text-[10px] sm:text-xs md:text-sm font-bold tracking-widest uppercase">
        <div className="animate-marquee inline-block">
          {events.length > 0 ? (
            [...events, ...events, ...events].map((event, idx) => (
              <React.Fragment key={`${event.id}-${idx}`}>
                <span className="mx-4 sm:mx-8">
                  {event.title} — {event.venue} • {event.price}
                </span>
                •
              </React.Fragment>
            ))
          ) : (
            <>
              <span className="mx-4 sm:mx-8">
                IPL FINAL 2026 - SOLD 1,247 TICKETS TODAY
              </span>{" "}
              •<span className="mx-4 sm:mx-8">DILJIT DOSANJH MUMBAI TOUR</span>{" "}
              •
              <span className="mx-4 sm:mx-8">
                COLDPLAY INDIA 2026 - SEATS FILLING FAST
              </span>
            </>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="bg-[#F8F9FA]">
        {/* CATEGORY FILTER BAR */}
        <div className="bg-[#EBECEF] border-b border-gray-200">
          {/* touch-pan-x ensures smooth mobile swiping */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-4 flex gap-3 overflow-x-auto no-scrollbar items-center touch-pan-x">
            {categories.map((cat, i) => (
              <button
                key={cat}
                onClick={() =>
                  router.push(`/events?category=${encodeURIComponent(cat)}`)
                }
                className={`whitespace-nowrap px-5 py-2.5 sm:px-6 border rounded-sm text-sm font-bold transition-all cursor-pointer ${
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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-24">
          <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h2 className="text-sm font-bold tracking-wider text-gray-900 uppercase">
              Featured Events
            </h2>
            <Link
              href="/events"
              className="text-blue-600 text-sm font-bold flex items-center gap-1 hover:underline p-2 -mr-2"
            >
              VIEW ALL <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse h-80 flex flex-col p-6"
                >
                  <div className="bg-gray-200 h-40 w-full rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-3 w-1/3 rounded mb-2"></div>
                  <div className="bg-gray-200 h-5 w-3/4 rounded mb-6"></div>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                    <div className="bg-gray-200 h-4 w-1/4 rounded"></div>
                  </div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-500 font-bold uppercase tracking-wider text-sm">
                NO LIVE TICKETMASTER EVENTS FOUND
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  onClick={() => router.push(`/events/${event.id}`)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-blue-600 transition-colors group cursor-pointer shadow-sm hover:shadow-md flex flex-col"
                >
                  <div className="h-48 sm:h-56 relative overflow-hidden bg-gray-200">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {event.tag && (
                      <div
                        className={`absolute top-4 left-4 text-[10px] font-bold px-2.5 py-1 rounded-sm ${event.tagColor}`}
                      >
                        {event.tag}
                      </div>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    <p className="text-blue-600 text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-2">
                      {event.date}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mb-6 sm:mb-8 line-clamp-2">
                      {event.title}
                    </h3>
                    <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                      <span className="text-blue-600 font-mono font-bold text-base">
                        {event.price}
                      </span>
                      <span className="text-gray-900 text-xs font-bold tracking-wide flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                        BOOK NOW{" "}
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white py-16 lg:py-24 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="mb-12 lg:mb-16 max-w-xl text-center sm:text-left mx-auto sm:mx-0">
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                Simple. Fast. Final.
              </h2>
              <p className="text-gray-500 text-base font-medium">
                Our system is engineered for the highest load events on the
                planet.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center sm:text-left">
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
                  <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-blue-50 mb-4 sm:mb-6">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24 grid grid-cols-2 lg:flex lg:flex-row justify-center gap-4 sm:gap-6">
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
              <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-blue-600 mb-2">
                {stat.value}
              </div>
              <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* CTA BANNER */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pb-16 lg:pb-24">
          <div className="bg-blue-600 rounded-xl sm:rounded-2xl p-8 lg:p-16 flex flex-col lg:flex-row justify-between items-center text-center lg:text-left gap-8 shadow-xl">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                NEVER MISS ANOTHER BEAT.
              </h2>
              <p className="text-blue-100 text-base lg:text-lg font-medium">
                Join 2 million fans getting the best seats first.
              </p>
            </div>
            <button
              onClick={() => router.push("/auth/register")}
              className="bg-white text-blue-600 px-8 py-4 rounded-md font-bold text-sm tracking-wide shadow-sm hover:bg-gray-50 transition-colors whitespace-nowrap w-full sm:w-auto cursor-pointer min-h-[56px]"
            >
              CREATE ACCOUNT
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <Footer />

      {/* CSS for marquee animation & utilities */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
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
