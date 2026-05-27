"use client";

// 1. ADD useEffect and useCallback to your imports
import React, { useState, useRef, useEffect, useCallback } from "react";
import Script from "next/script";
import { Eye, EyeOff } from "lucide-react";
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

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login, loginWithGoogle } = useApp();

  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const success = await login(email, password);
      if (success) {
        router.push("/events");
      } else {
        setError("Invalid credentials. Please verify and try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
      {/* 4. KEEP the onLoad event for the very first time the app ever downloads the script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleAuth}
      />

      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center">
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
            className="text-blue-600 text-sm font-semibold hover:text-blue-800 transition-colors"
          >
            Help
          </Link>
        </div>
      </nav>

      {/* MAIN CONTENT - LOGIN CARD */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-gray-200 p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Enter your credentials to access your tickets
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-bold tracking-wide uppercase">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
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
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400"
                required
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-sm font-semibold text-gray-700"
                  htmlFor="password"
                >
                  Password
                </label>
                <Link
                  href="#"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all text-sm font-medium placeholder-gray-400 pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0D6EFD] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 transition-colors shadow-sm mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Processing...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              OR
            </span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="w-full flex justify-center min-h-[44px]">
            <div ref={googleButtonRef}></div>
          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 font-medium">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
              >
                Sign Up
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
