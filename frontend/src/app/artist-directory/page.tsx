"use client";

import React, { useState, useEffect } from "react";
import { Search, Globe, Music, Calendar, MapPin, Loader2, Key } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function ArtistDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [apiKey, setApiKey] = useState("2"); // default test key
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState("EN");
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % 4);
      }, 400);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const LOADING_STATUSES = [
    "ACQUIRING GATEWAY ADDR...",
    "ESTABLISHING SECURE CONNECTION...",
    "RESOLVING AUDIODB ENVELOPE...",
    "DECRYPTING PAYLOAD SPEC..."
  ];

  // Default initial search to present a premium look
  useEffect(() => {
    fetchArtist("Coldplay");
  }, []);

  const fetchArtist = async (name: string) => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.theaudiodb.com/api/v1/json/${apiKey}/search.php?s=${encodeURIComponent(
          name.trim()
        )}`
      );
      if (!response.ok) {
        throw new Error("Gateway failed to resolve the external metadata source.");
      }
      const data = await response.json();
      if (data && data.artists && data.artists.length > 0) {
        setSelectedArtist(data.artists[0]);
        setSelectedLang("EN");
      } else {
        setSelectedArtist(null);
        setError(`No registry records found for artist "${name}". Ensure spelling is correct.`);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch artist registry metadata. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArtist(searchQuery);
  };

  const PRESET_ARTISTS = ["Coldplay", "Queen", "Eminem", "Nirvana", "Taylor Swift", "Daft Punk"];

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12">
        {/* Banner Section */}
        <div className="mb-10 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10 max-w-3xl flex flex-col gap-4">
            <span className="text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase">
              AUDIODB META RESOLVER v1.0
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
              Artist Metadata Directory
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Query millions of music profiles directly through TheAudioDB integration. View banners, detailed biographies, genre mappings, and formed histories instantly.
            </p>
          </div>
        </div>

        {/* Console Search Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white border border-gray-200 p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
              QUERY REGISTRY SOURCE
            </h3>
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Enter artist name (e.g. Coldplay, Queen...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 font-medium text-sm transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 font-bold text-xs tracking-wider uppercase hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-blue-400 active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : "QUERY"}
              </button>
            </form>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <span className="text-[10px] font-extrabold text-gray-400 tracking-wider">POPULAR SUGGESTIONS:</span>
              {PRESET_ARTISTS.map((name) => (
                <button
                  key={name}
                  onClick={() => {
                    setSearchQuery(name);
                    fetchArtist(name);
                  }}
                  className="text-xs font-bold text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 border border-gray-200 cursor-pointer transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Premium Custom Key config */}
          <div className="bg-white border border-gray-200 p-6 shadow-sm flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Key size={14} /> CREDENTIAL STORAGE
              </h3>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed mb-4">
                Ticketizer uses the free developer credential (<code className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded-sm">2</code> / <code className="text-blue-600 font-bold bg-blue-50 px-1 py-0.5 rounded-sm">123</code>) by default. Replace with your premium API key below if needed.
              </p>
            </div>
            <div>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key (default: 2)"
                className="w-full px-4 py-3 outline-none text-gray-900 border border-gray-250 focus:border-blue-600 font-mono text-xs transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Results Console */}
        {loading ? (
          <div className="bg-white border border-gray-200 p-16 flex flex-col items-center justify-center gap-6 text-center shadow-sm relative overflow-hidden">
            {/* Holographic scanner effect line */}
            <div className="absolute left-0 right-0 h-0.5 bg-blue-600/30 top-0 animate-scanner"></div>
            
            {/* Intentional brutalist square matrix node */}
            <div className="relative w-16 h-16 flex items-center justify-center bg-gray-50 border-2 border-gray-900 shadow-[4px_4px_0px_#2569eb]">
              {/* Pulsing inner dashed grid */}
              <div className="absolute inset-1.5 border border-dashed border-gray-250 animate-pulse"></div>
              {/* Clean rotating brutalist accent square */}
              <div className="w-6 h-6 border-2 border-blue-600 bg-blue-50/50 animate-spin"></div>
              {/* Concentric core locking terminal indicator */}
              <div className="absolute w-2.5 h-2.5 bg-[#BFFF00] animate-pulse"></div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-blue-600 tracking-widest uppercase block animate-pulse">
                {LOADING_STATUSES[loadingStep]}
              </span>
              <span className="text-[10px] font-mono text-gray-400 tracking-wider uppercase block">
                GATEWAY LATENCY: 14MS // TLS 1.3 ACTIVE
              </span>
            </div>

            {/* Custom progress indicators */}
            <div className="flex gap-1.5 justify-center">
              {LOADING_STATUSES.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-8 h-1 transition-all duration-300 ${
                    idx <= loadingStep ? "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
                @keyframes scanner {
                  0% { top: 0%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 100%; opacity: 0; }
                }
                .animate-scanner {
                  animation: scanner 2s linear infinite;
                }
              `
            }} />
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 p-8 text-center text-red-600 font-bold tracking-wider uppercase text-xs shadow-sm flex flex-col gap-2">
            <div>⚠️ RESOLVER CONSOLE ERROR</div>
            <div className="text-gray-500 font-medium tracking-normal text-sm normal-case">{error}</div>
          </div>
        ) : selectedArtist ? (
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            {/* Banner block */}
            {selectedArtist.strArtistBanner ? (
              <div className="h-44 sm:h-56 lg:h-64 relative bg-gray-900 border-b border-gray-200">
                <img
                  src={selectedArtist.strArtistBanner}
                  alt={selectedArtist.strArtist}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 bg-blue-900 relative border-b border-gray-200 flex items-center justify-center">
                <span className="text-white text-xs font-mono font-bold tracking-widest">
                  NO REGISTERED BANNER IN AUDIODB
                </span>
              </div>
            )}

            {/* Profile information */}
            <div className="p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Left Thumbnail photo */}
                <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
                  <div className="aspect-square border border-gray-200 bg-gray-50 overflow-hidden shadow-sm relative group">
                    <img
                      src={
                        selectedArtist.strArtistThumb ||
                        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600"
                      }
                      alt={selectedArtist.strArtist}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  </div>

                  {/* Logo Banner */}
                  {selectedArtist.strArtistLogo && (
                    <div className="border border-gray-150 p-4 bg-gray-50 flex items-center justify-center">
                      <img
                        src={selectedArtist.strArtistLogo}
                        alt="Logo"
                        className="max-h-16 w-auto object-contain"
                      />
                    </div>
                  )}

                  {/* Specs Card */}
                  <div className="border border-gray-200 p-5 space-y-4 text-xs font-bold text-gray-500">
                    <h4 className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest pb-2 border-b border-gray-100">
                      REGISTRY SPEC SHEET
                    </h4>
                    <div className="flex justify-between items-center">
                      <span>FORMED YEAR</span>
                      <span className="text-gray-900 flex items-center gap-1.5">
                        <Calendar size={13} className="text-blue-600" />
                        {selectedArtist.intFormedYear || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>GENRE</span>
                      <span className="text-gray-900 flex items-center gap-1.5">
                        <Music size={13} className="text-blue-600" />
                        {selectedArtist.strGenre || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>STYLE</span>
                      <span className="text-gray-900">{selectedArtist.strStyle || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>ORIGIN</span>
                      <span className="text-gray-900 flex items-center gap-1.5">
                        <MapPin size={13} className="text-blue-600" />
                        {selectedArtist.strCountry || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Social links */}
                  <div className="flex gap-2">
                    {selectedArtist.strWebsite && (
                      <a
                        href={
                          selectedArtist.strWebsite.startsWith("http")
                            ? selectedArtist.strWebsite
                            : `https://${selectedArtist.strWebsite}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-3 border border-gray-200 rounded-sm hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold bg-white cursor-pointer"
                      >
                        <Globe size={13} />
                        Website
                      </a>
                    )}
                    {selectedArtist.strFacebook && (
                      <a
                        href={
                          selectedArtist.strFacebook.startsWith("http")
                            ? selectedArtist.strFacebook
                            : `https://${selectedArtist.strFacebook}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 border border-gray-200 rounded-sm hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center bg-white cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-gray-600 hover:text-blue-600" viewBox="0 0 24 24">
                          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                        </svg>
                      </a>
                    )}
                    {selectedArtist.strTwitter && (
                      <a
                        href={
                          selectedArtist.strTwitter.startsWith("http")
                            ? selectedArtist.strTwitter
                            : `https://${selectedArtist.strTwitter}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="w-12 h-12 border border-gray-200 rounded-sm hover:border-blue-600 hover:text-blue-600 transition-colors flex items-center justify-center bg-white cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-gray-600 hover:text-blue-600" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Right Detailed biography */}
                <div className="flex-grow flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-1 border-b border-gray-100 pb-4">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
                      {selectedArtist.strArtist}
                    </h2>
                    <span className="text-xs font-bold text-gray-400 tracking-wider">
                      REGISTRY ID: {selectedArtist.idArtist}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-wrap gap-2">
                      <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                        BIOGRAPHICAL ANNOTATION
                      </h3>
                      
                      {/* Interactive Language Selector Tabs */}
                      {selectedArtist && (() => {
                        const biosList = [
                          { lang: "EN", label: "EN", text: selectedArtist.strBiography || selectedArtist.strBiographyEN },
                          { lang: "DE", label: "DE", text: selectedArtist.strBiographyDE },
                          { lang: "FR", label: "FR", text: selectedArtist.strBiographyFR },
                          { lang: "CN", label: "CN", text: selectedArtist.strBiographyCN },
                          { lang: "IT", label: "IT", text: selectedArtist.strBiographyIT },
                          { lang: "JP", label: "JP", text: selectedArtist.strBiographyJP },
                          { lang: "RU", label: "RU", text: selectedArtist.strBiographyRU },
                          { lang: "ES", label: "ES", text: selectedArtist.strBiographyES },
                          { lang: "PT", label: "PT", text: selectedArtist.strBiographyPT },
                          { lang: "SE", label: "SE", text: selectedArtist.strBiographySE },
                          { lang: "NL", label: "NL", text: selectedArtist.strBiographyNL },
                          { lang: "HU", label: "HU", text: selectedArtist.strBiographyHU },
                          { lang: "NO", label: "NO", text: selectedArtist.strBiographyNO },
                          { lang: "IL", label: "IL", text: selectedArtist.strBiographyIL },
                          { lang: "PL", label: "PL", text: selectedArtist.strBiographyPL },
                        ].filter(b => b.text && b.text.trim().length > 0);

                        if (biosList.length <= 1) return null;

                        return (
                          <div className="flex gap-1 flex-wrap">
                            {biosList.map((b) => (
                              <button
                                key={b.lang}
                                onClick={() => setSelectedLang(b.lang)}
                                className={`px-2 py-1 text-[10px] font-mono font-bold border cursor-pointer transition-all ${
                                  selectedLang === b.lang
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                {b.label}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    
                    <p className="text-gray-600 text-sm sm:text-base font-medium leading-relaxed whitespace-pre-wrap">
                      {(() => {
                        const biosList = [
                          { lang: "EN", text: selectedArtist.strBiography || selectedArtist.strBiographyEN },
                          { lang: "DE", text: selectedArtist.strBiographyDE },
                          { lang: "FR", text: selectedArtist.strBiographyFR },
                          { lang: "CN", text: selectedArtist.strBiographyCN },
                          { lang: "IT", text: selectedArtist.strBiographyIT },
                          { lang: "JP", text: selectedArtist.strBiographyJP },
                          { lang: "RU", text: selectedArtist.strBiographyRU },
                          { lang: "ES", text: selectedArtist.strBiographyES },
                          { lang: "PT", text: selectedArtist.strBiographyPT },
                          { lang: "SE", text: selectedArtist.strBiographySE },
                          { lang: "NL", text: selectedArtist.strBiographyNL },
                          { lang: "HU", text: selectedArtist.strBiographyHU },
                          { lang: "NO", text: selectedArtist.strBiographyNO },
                          { lang: "IL", text: selectedArtist.strBiographyIL },
                          { lang: "PL", text: selectedArtist.strBiographyPL },
                        ].filter(b => b.text && b.text.trim().length > 0);

                        const current = biosList.find(b => b.lang === selectedLang) || biosList[0];
                        return current ? current.text : "No biography available for this artist.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-dashed border-gray-300 p-16 text-center text-gray-400 font-bold tracking-wider uppercase text-sm">
            Enter an artist search query to initialize the metadata resolver.
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
