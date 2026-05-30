"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Send, ShieldCheck, Check } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    // Simulate API form post
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      
      // Auto-hide success checkmark after 4 seconds
      setTimeout(() => setSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-12">
        {/* Banner Section */}
        <div className="mb-12 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <Mail size={14} className="animate-pulse" />
              TICKETIZER GATEWAY TERMINALS
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Contact Gateway.
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Connect directly with our transactional database support desk, corporate channels, or emergency DevOps response grid.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Information blocks */}
          <div className="lg:col-span-5 space-y-6">
            {[
              {
                title: "DEVOPS SUPPORT HELPDESK",
                label: "support@ticketizer.com",
                desc: "Average transaction diagnostic latency: <12 minutes.",
                icon: Mail,
              },
              {
                title: "EMERGENCY HOTLINE (CORE LOCKS)",
                label: "+1 (800) 555-TKTS",
                desc: "Active 24/7 during viral, tier-1 sale periods.",
                icon: Phone,
              },
              {
                title: "CORPORATE REGISTERED HEADQUARTERS",
                label: "32 Gateway Station Plaza",
                desc: "Tech Hub Tower, Level 44, Toronto, CA.",
                icon: MapPin,
              },
            ].map((channel, i) => {
              const Icon = channel.icon;
              return (
                <div key={i} className="bg-white border border-gray-200 p-6 shadow-sm flex gap-4">
                  <div className="w-12 h-12 border border-blue-200 text-blue-600 flex items-center justify-center bg-blue-50 flex-shrink-0">
                    <Icon size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-600 tracking-wider uppercase block">
                      {channel.title}
                    </span>
                    <span className="text-base sm:text-lg font-black text-gray-900 block">
                      {channel.label}
                    </span>
                    <p className="text-xs text-gray-500 font-medium">{channel.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive messaging form */}
          <div className="lg:col-span-7 bg-white border border-gray-200 p-8 shadow-sm space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
                TRANSMIT MESSAGE PACKET
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Route queries directly into the core customer service queue.
              </p>
            </div>

            {success ? (
              <div className="border border-green-200 bg-green-50 p-6 text-center text-green-700 font-bold uppercase tracking-wider text-xs flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center">
                  <Check size={20} />
                </div>
                <div>MESSAGE TRANSACTION COMPLETED</div>
                <p className="text-gray-500 font-medium normal-case tracking-normal text-xs max-w-sm mt-1">
                  Your message has been securely committed to the support registry. A diagnostic engineer will respond shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-400 tracking-wider block">YOUR NAME *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 text-sm font-medium transition-colors"
                      placeholder="e.g. Satoshi Nakamoto"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold text-gray-400 tracking-wider block">YOUR EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 text-sm font-medium transition-colors"
                      placeholder="e.g. satoshi@bitcoin.org"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 tracking-wider block">SUBJECT</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 text-sm font-medium transition-colors"
                    placeholder="e.g. Session seat lock ticket issue"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-gray-400 tracking-wider block">MESSAGE BODY *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 outline-none text-gray-900 border border-gray-200 focus:border-blue-600 text-sm font-medium transition-colors resize-none"
                    placeholder="Provide full booking registry parameters or transaction ID..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 py-3.5 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:bg-blue-400 active:scale-99"
                >
                  {loading ? "TRANSMITTING..." : (
                    <>
                      TRANSMIT <Send size={13} />
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="flex gap-2 items-center text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-150 p-3 rounded-sm justify-center">
              <ShieldCheck size={14} className="text-green-600" />
              <span>TLSv1.3 SECURITY TUNNEL COMMITTED</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
