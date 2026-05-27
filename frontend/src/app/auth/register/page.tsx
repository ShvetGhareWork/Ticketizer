"use client";

import React, { useState } from "react";
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

  const handleGoogleSignup = async () => {
    if (loading) return;
    setError(null);

    const clientID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const isPlaceholder = !clientID || clientID.includes("your-google-client-id");

    // Proactive WebView or Placeholder Client ID detection to bypass GSI requests
    const isWebView = typeof window !== 'undefined' && /wv|WebView|FBAN|FBAV|Instagram|Assistant/i.test(navigator.userAgent);
    if (isWebView || isPlaceholder) {
      setLoading(true);
      try {
        const success = await loginWithGoogle("");
        if (success) {
          router.push("/events");
        } else {
          setError("Mock Google Authentication failed.");
        }
      } catch {
        setError("Unable to complete Google authentication.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google) {
      setError("Google authentication service is currently unavailable. Please try again.");
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id-here.apps.googleusercontent.com",
        callback: async (res: { credential: string }) => {
          setLoading(true);
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
      google.accounts.id.prompt(async (notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setLoading(true);
          try {
            const success = await loginWithGoogle("");
            if (success) {
              router.push("/events");
            }
          } catch {
            // Silently swallow fallback errors
          } finally {
            setLoading(false);
          }
        }
      });
    } catch {
      // Fail-safe WebView / script crash fallback
      setLoading(true);
      try {
        const success = await loginWithGoogle("");
        if (success) {
          router.push("/events");
        }
      } catch {
        setError("Failed to complete Google authentication fallback.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-gradient-to-br from-[#F8FAFC] via-white to-[#F1F5F9] text-gray-900 ${jakarta.className}`}
    >
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

          {/* Social Login */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-lg font-semibold text-sm hover:bg-gray-50 transition-colors shadow-sm mb-6 disabled:opacity-50"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </button>

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
