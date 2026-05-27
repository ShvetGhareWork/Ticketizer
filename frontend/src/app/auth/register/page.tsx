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
    if (!terms) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const success = await register(fullName, email, password);
      if (success) {
        router.push("/events");
      } else {
        setError("Registration failed. Please check your credentials.");
      }
    } catch {
      setError("An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  // 2. WRAP the initialization in useCallback so it can be safely used in useEffect
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

    google.accounts.id.renderButton(googleButtonRef.current, {
      theme: "outline",
      size: "large",
      width: 400,
      text: "continue_with",
    });
  }, [loginWithGoogle, router]); // Dependencies required for useCallback

  // 3. ADD useEffect to check if Google is already loaded when the page mounts
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).google) {
      initializeGoogleAuth();
    }
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
      <nav className="flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center">
          {/* Logo */}
          <Link
            href="/"
            className="font-extrabold text-2xl tracking-tight text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ticketizer
          </Link>
        </div>

        <div>
          <Link
            href="#"
            className="text-gray-600 text-sm font-semibold hover:text-gray-900 transition-colors"
          >
            Help
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT - SIGNUP CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 pb-12">
        <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-200 p-8 sm:p-12">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Join Ticketizer today and start your journey.
            </p>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold tracking-wide uppercase">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name Field */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-1.5"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Email Field */}
            <div>
              <label
                className="block text-sm font-semibold text-gray-700 mb-1.5"
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
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            {/* Password Grid (Side-by-Side on Desktop, Stacked on Mobile) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Password Field */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  className="block text-sm font-semibold text-gray-700 mb-1.5"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
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
                  className="w-4 h-4 border border-gray-300 rounded bg-white checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-1 transition-colors cursor-pointer"
                  required
                  disabled={loading}
                />
              </div>
              <label
                htmlFor="terms"
                className="ml-2.5 text-sm font-medium text-gray-600 cursor-pointer"
              >
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D6EFD] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-800 transition-colors shadow-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
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
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Button Container */}
          <div className="w-full flex justify-center min-h-[44px] mb-6">
            <div ref={googleButtonRef}></div>
          </div>

          {/* Footer Link */}
          <div className="text-center mt-2">
            <p className="text-sm text-gray-600 font-medium">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#F8F9FA] border-t border-gray-200">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="font-extrabold text-xl text-gray-900 mb-1 tracking-tight">
              Ticketizer
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              © 2024 Ticketizer Inc. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end gap-6 text-xs font-semibold text-gray-600">
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Cookie Settings
            </Link>
            <Link href="#" className="hover:text-gray-900 transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
