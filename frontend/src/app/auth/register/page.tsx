"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";

// Initialize the font
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"EMAIL" | "SMS">("EMAIL");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { register, loginWithGoogle } = useApp();

  // Create a ref for the Google button container
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (verificationMethod === "SMS" && !phoneNumber.trim()) {
      setError("Phone number is required for SMS verification.");
      return;
    }
    if (!terms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await register(fullName, email, password, phoneNumber, verificationMethod);
      if (success) {
        router.push("/auth/verify");
      } else {
        setError("Registration failed. Please check your credentials.");
      }
    } catch {
      setError("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogleAuth = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google || !googleButtonRef.current) return;

    const clientID =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "your-google-client-id-here.apps.googleusercontent.com";

    google.accounts.id.initialize({
      client_id: clientID,
      callback: async (res: { credential: string }) => {
        setLoading(true);
        setError(null);
        try {
          const success = await loginWithGoogle(res.credential);
          if (success) {
            router.push("/events");
          } else {
            setError("Google Authentication failed. Please try again.");
          }
        } catch {
          setError("Unable to complete Google authentication.");
        } finally {
          setLoading(false);
        }
      },
    });

    // Dynamically constrain GIS iframe width to parent container bounds
    const containerWidth = googleButtonRef.current.offsetWidth || 320;
    const buttonWidth = Math.min(containerWidth, 400);

    google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: buttonWidth,
      text: "continue_with",
    });
  }, [loginWithGoogle, router]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== "undefined" && (window as any).google) {
      initializeGoogleAuth();
    }

    // Optional: Re-render button on viewport change to maintain correct width
    const handleResize = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).google && googleButtonRef.current) {
        googleButtonRef.current.innerHTML = ""; // Clear existing iframe
        initializeGoogleAuth();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [initializeGoogleAuth]);

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] text-gray-900 ${jakarta.className}`}
    >
      {/* Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleAuth}
      />

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        <div className="flex items-center">
          {/* Logo */}
          <Link
            href="/"
            className="font-extrabold text-xl sm:text-2xl tracking-tight text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ticketizer
          </Link>
        </div>

        <div>
          <Link
            href="#"
            className="text-gray-600 text-xs sm:text-sm font-semibold hover:text-gray-900 transition-colors p-2"
          >
            Help
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT - SIGNUP CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-8 sm:pb-12 w-full">
        <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-200 p-6 sm:p-10 lg:p-12">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Join Ticketizer today and start your journey.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide uppercase">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div>
              <label
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                htmlFor="fullName"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                htmlFor="email"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Phone Number Field */}
            <div>
              <label
                className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                htmlFor="phoneNumber"
              >
                Phone Number (for Mobile OTP)
              </label>
              <div className="flex border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-transparent transition-all overflow-hidden">
                <div className="bg-gray-50 px-3 py-3 border-r border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  +91
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 outline-none text-sm font-medium placeholder-gray-400"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Verification Channel Toggle */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
                OTP Verification Channel
              </label>
              <div className="flex bg-[#F0F4F8] p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setVerificationMethod("EMAIL")}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    verificationMethod === "EMAIL"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Email OTP
                </button>
                <button
                  type="button"
                  disabled={!phoneNumber.trim()}
                  onClick={() => setVerificationMethod("SMS")}
                  className={`flex-1 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    verificationMethod === "SMS"
                      ? "bg-white shadow-sm text-blue-600"
                      : "text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  SMS OTP
                </button>
              </div>
              {!phoneNumber.trim() && (
                <p className="text-[10px] text-gray-400 mt-1">Provide a mobile number to unlock SMS OTP.</p>
              )}
            </div>

            {/* Password Grid (Side-by-Side on Desktop, Stacked on Mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Password Field */}
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 sm:py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start pt-2">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="w-5 h-5 sm:w-4 sm:h-4 border border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 transition-colors cursor-pointer"
                  required
                  disabled={loading}
                />
              </div>
              <label
                htmlFor="terms"
                className="ml-3 sm:ml-2.5 text-xs sm:text-sm font-medium text-gray-600 cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D6EFD] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-800 transition-colors shadow-sm mt-6 sm:mt-4 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 sm:my-7">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Button Container */}
          <div className="w-full flex justify-center min-h-[44px] mb-4 sm:mb-6">
            <div
              ref={googleButtonRef}
              className="w-full flex justify-center"
            ></div>
          </div>

          {/* Footer Link */}
          <div className="text-center mt-2">
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors p-1"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F8F9FA] border-t border-gray-200 mt-auto">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <div className="text-center md:text-left">
            <h2 className="font-extrabold text-lg sm:text-xl text-gray-900 mb-1 tracking-tight">
              Ticketizer
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 font-medium">
              © 2026 Ticketizer Inc. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-[10px] sm:text-xs font-semibold text-gray-600">
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Cookie Settings
            </Link>
            <Link
              href="#"
              className="hover:text-gray-900 transition-colors py-1"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
