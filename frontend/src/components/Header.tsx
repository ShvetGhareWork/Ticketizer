"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LogOut, User } from "lucide-react";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { authToken, logout } = useApp();

  return (
    <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-8 lg:gap-12">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-extrabold text-lg sm:text-xl tracking-tight text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <div className="w-3 h-3 bg-[#BFFF00]"></div>
          Ticketizer
        </Link>
        {/* Desktop Nav Links */}
        <div className="hidden md:flex gap-8 text-sm font-semibold text-gray-500">
          <Link
            href="/events"
            className={`${
              pathname?.startsWith("/events")
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "hover:text-gray-900 transition-colors"
            }`}
          >
            EVENTS
          </Link>
          <Link
            href="/my-bookings"
            className={`${
              pathname === "/my-bookings"
                ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                : "hover:text-gray-900 transition-colors"
            }`}
          >
            MY BOOKINGS
          </Link>
        </div>
      </div>
      {/* Auth Buttons */}
      <div className="flex items-center gap-4 lg:gap-6">
        {authToken ? (
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-sm border border-gray-200">
              <User size={13} className="text-blue-600" />
              SECURE KEY ACTIVE
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2 rounded-sm transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="hidden sm:block text-sm font-semibold hover:text-blue-600 transition-colors"
            >
              Sign In
            </Link>
            <button
              onClick={() => router.push("/auth/register")}
              className="bg-blue-600 text-white px-4 py-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-bold rounded hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
