"use client";

import React from "react";
import Link from "next/link";
import { Share2, Bell, Shield, Terminal } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <Link
              href="/"
              className="font-extrabold text-xl sm:text-2xl tracking-tight text-blue-900 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-3.5 h-3.5 bg-[#BFFF00] shadow-[0_0_8px_rgba(191,255,0,0.5)]"></div>
              Ticketizer
            </Link>
            <p className="text-gray-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              The high-concurrency brutalist ticket reservation console for real-time seat lock and checkout settlement. Seats don&apos;t wait.
            </p>
            <div className="flex items-center gap-2.5 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-sm">
              <Shield size={12} />
              TRANSACTIONAL LOCK PROTOCOL v2.4 ACTIVE
            </div>
          </div>

          {/* Links Section matching the mockup exactly */}
          <div className="md:col-span-5 grid grid-cols-2 gap-8 text-center md:text-left">
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold tracking-widest text-blue-600 uppercase mb-6 sm:mb-8">
                DISCOVER
              </h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold tracking-tight">
                <li>
                  <Link
                    href="/venues"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    Venues
                  </Link>
                </li>
                <li>
                  <Link
                    href="/artist-directory"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    Artist Directory
                  </Link>
                </li>
                <li>
                  <Link
                    href="/trending"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    Trending
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold tracking-widest text-blue-600 uppercase mb-6 sm:mb-8">
                COMPANY
              </h4>
              <ul className="space-y-4 text-sm text-gray-600 font-bold tracking-tight">
                <li>
                  <Link
                    href="/help"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    Help
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-blue-600 transition-colors flex items-center justify-center md:justify-start gap-1.5"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Socials & Interactive Ticker */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end gap-6">
            <div className="flex gap-4">
              <button 
                title="Share Ticketizer"
                className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all bg-gray-50 cursor-pointer shadow-sm active:scale-95"
              >
                <Share2 size={16} />
              </button>
              <button 
                title="Alert Notifications"
                className="w-10 h-10 border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50 transition-all bg-gray-50 cursor-pointer shadow-sm active:scale-95 animate-pulse-fast"
              >
                <Bell size={16} />
              </button>
            </div>
            
            <div className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-150 p-3 rounded-sm flex items-center gap-1.5">
              <Terminal size={12} className="text-gray-500" />
              <span>SYS_LATENCY: 18ms</span>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Copyright Bar */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
          <p className="text-gray-400 text-xs font-semibold tracking-wide">
            &copy; {new Date().getFullYear()} TICKETIZER INC. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-xs font-bold text-gray-400">
            <Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
