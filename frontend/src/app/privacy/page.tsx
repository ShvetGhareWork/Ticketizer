"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Shield, Eye, Lock, Server } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function PrivacyPolicyPage() {
  return (
    <div className={`min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col ${jakarta.className}`}>
      <Header />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        {/* Banner Section */}
        <div className="mb-12 border border-gray-200 bg-white p-8 sm:p-12 relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#E5E7EB 1px, transparent 1px), linear-gradient(90deg, #E5E7EB 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-600 text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-4">
              <Lock size={14} />
              DATA PRIVACY LEDGER
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-500 text-sm sm:text-base font-medium leading-relaxed">
              Last updated: June 7, 2026. Review how we protect your OAuth tokens, account credentials, and ticket reservation details.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Eye size={14} /> 1. DATA COLLECTION & INGRESS
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              To operate our high-speed ticketing booking system, we collect minimal user identifiers. This includes your full name, email address, password hash, phone number, and seat selection configurations. No financial details (credit card tokens) are stored on our servers; they are directly tokenized by our SSL-encrypted payment partners.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Lock size={14} /> 2. JWT TOKENS & SECURITY GATEWAYS
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Your authentication context is stored locally on your device via <code>localStorage</code> under stateful JWT tokens. These tokens are signed with cryptographic signatures (HMAC-SHA256). All communications between the client CDN and the Spring Boot core endpoints run via encrypted TLS v1.3 tunnels.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Server size={14} /> 3. DATA RETENTION & SHARING
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              Account registry information is kept until you explicitly request deletion of your account. Transaction history (event titles, shows, seating details, checkouts) is archived for auditing purposes. We do not sell, share, or lease your diagnostic or personal statistics to advertising third parties.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Shield size={14} /> 4. USER SYSTEM RIGHTS
            </h3>
            <p className="text-gray-600 text-sm font-medium leading-relaxed">
              You maintain full rights to inspect your active database reservation records and correct profile information in the system console. To request a complete purge of your account logs, please contact the DevOps Helpdesk.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
