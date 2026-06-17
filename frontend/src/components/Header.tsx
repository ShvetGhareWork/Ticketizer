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

  const isBookingPath =
    pathname?.includes("/seats") ||
    pathname?.includes("/checkout") ||
    pathname?.includes("/booking/");

  return (
    <nav className="flex items-center justify-between px-3 sm:px-6 lg:px-12 py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center gap-3 sm:gap-8 lg:gap-12 min-w-0">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-1.5 font-extrabold text-sm sm:text-xl tracking-tight text-gray-900 hover:text-blue-600 transition-colors cursor-pointer flex-shrink-0"
        >
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-[#BFFF00]"></div>
          Ticketizer
        </Link>
        {/* Responsive Nav Links */}
        {!isBookingPath && (
          <div className="flex gap-2 sm:gap-6 md:gap-8 text-[9px] sm:text-xs md:text-sm font-extrabold text-gray-500 tracking-wider">
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
            <Link
              href="/notifications"
              className={`${
                pathname === "/notifications"
                  ? "text-blue-600 border-b-2 border-blue-600 pb-1"
                  : "hover:text-gray-900 transition-colors"
              }`}
            >
              NOTIFICATIONS
            </Link>
          </div>
        )}
      </div>
      {/* Auth Buttons */}
      <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
        {authToken ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-3 py-1.5 rounded-sm border border-gray-200">
              <User size={13} className="text-blue-600" />
              SECURE KEY ACTIVE
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/auth/login");
              }}
              className="flex items-center gap-1.5 text-[10px] sm:text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 p-2 sm:px-4 sm:py-2 rounded-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <LogOut size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
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
              className="bg-blue-600 text-white px-3 py-2 lg:px-6 lg:py-2.5 text-[10px] sm:text-sm font-bold rounded hover:bg-blue-700 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              Get Started
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
