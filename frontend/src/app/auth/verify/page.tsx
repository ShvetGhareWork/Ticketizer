"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ShieldCheck, ArrowLeft, RefreshCw, Send, CheckCircle2 } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export default function VerifyPage() {
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("EMAIL");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const { verifyOtp, resendOtp, isVerified } = useApp();

  // Load user session context from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserEmail(localStorage.getItem("userEmail") || "");
      setUserPhone(localStorage.getItem("userPhone") || "");
      setVerificationMethod(localStorage.getItem("verificationMethod") || "EMAIL");
      
      const verified = localStorage.getItem("isVerified");
      if (verified === "true") {
        router.push("/events");
      }
    }
  }, [router]);

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Focus management helper for the OTP digits input grid
  const handleOtpChange = (index: number, val: string) => {
    if (/[^0-9]/.test(val)) return; // Allow numbers only
    
    const newValues = [...otpValues];
    newValues[index] = val;
    setOtpValues(newValues);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const newValues = [...otpValues];
      newValues[index - 1] = "";
      setOtpValues(newValues);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim().substring(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newValues = [...otpValues];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) newValues[i] = pastedData[i];
    }
    setOtpValues(newValues);
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = otpValues.join("");
    if (otp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const success = await verifyOtp(otp);
      if (success) {
        setSuccessMsg("Account successfully verified! Unlocking booking cluster...");
        setTimeout(() => {
          router.push("/events");
        }, 1500);
      } else {
        setError("Invalid verification code. Please check and try again.");
      }
    } catch {
      setError("Unable to reach the authentication service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;

    setResending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const success = await resendOtp(verificationMethod);
      if (success) {
        setSuccessMsg(`A fresh OTP code has been dispatched via ${verificationMethod}.`);
        setCountdown(60); // Set a longer countdown after resending
        setOtpValues(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError("Failed to resend verification code. Please try again.");
      }
    } catch {
      setError("Failed to dispatch resend request. Check connection.");
    } finally {
      setResending(false);
    }
  };

  const toggleMethod = async (newMethod: "EMAIL" | "SMS") => {
    if (resending || loading) return;
    setError(null);
    setSuccessMsg(null);
    
    if (newMethod === "SMS" && !userPhone) {
      setError("A mobile number is required to use SMS verification. Please sign up again.");
      return;
    }

    setResending(true);
    try {
      const success = await resendOtp(newMethod);
      if (success) {
        setVerificationMethod(newMethod);
        localStorage.setItem("verificationMethod", newMethod);
        setSuccessMsg(`Swapped verification channel and dispatched a fresh code via ${newMethod}.`);
        setCountdown(60);
        setOtpValues(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setError("Swapping channel failed.");
      }
    } catch {
      setError("Network error swapping channel.");
    } finally {
      setResending(false);
    }
  };

  const targetLabel = verificationMethod === "SMS" ? userPhone : userEmail;

  return (
    <div
      className={`min-h-screen bg-[#090b11] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none ${jakarta.className}`}
    >
      {/* Sleek Decorative Ambient Neon Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        {/* Clickable Back Button */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Login
        </Link>

        {/* Dynamic Glassmorphic Card Container */}
        <div className="bg-[#121620]/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
          
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 mb-4 animate-pulse">
              <ShieldCheck size={26} />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              Identity Verification
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed px-2">
              To secure seat allocation and locks, a 6-digit OTP code has been dispatched to your registered address:
            </p>
            <div className="mt-3 inline-flex items-center px-3 py-1 bg-gray-800/40 rounded-full border border-gray-700/30 text-xs sm:text-sm font-semibold text-blue-400 tracking-wide">
              {targetLabel || "unresolved destination"}
            </div>
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wide">
              {error}
            </div>
          )}

          {/* Verification Code Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-3 text-center tracking-wider uppercase">
                Enter 6-Digit OTP Code
              </label>
              
              {/* Digit Grid Inputs */}
              <div className="grid grid-cols-6 gap-2 max-w-sm mx-auto">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    className="w-full aspect-square text-center text-lg sm:text-xl font-bold bg-[#171c2a] border border-gray-700 hover:border-gray-600 focus:border-blue-500 text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                    disabled={loading || resending}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resending}
              className="w-full bg-[#0D6EFD] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 mt-4 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                  Verifying...
                </>
              ) : (
                "Verify & Activate Account"
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              Options
            </span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Resend Actions & Channel Toggle */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">OTP Resend Options:</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0 || resending || loading}
                className="text-blue-500 hover:text-blue-400 font-semibold transition-colors disabled:text-gray-600 flex items-center gap-1.5"
              >
                <RefreshCw size={12} className={resending ? "animate-spin" : ""} />
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Now"}
              </button>
            </div>

            {/* Toggle Channel Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => toggleMethod("EMAIL")}
                disabled={loading || resending || verificationMethod === "EMAIL"}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                  verificationMethod === "EMAIL"
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-[#171c2a] border-gray-700/50 text-gray-300 hover:bg-[#1f2638] hover:text-white"
                }`}
              >
                Send via Email
              </button>
              
              <button
                type="button"
                onClick={() => toggleMethod("SMS")}
                disabled={loading || resending || verificationMethod === "SMS" || !userPhone}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                  verificationMethod === "SMS"
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400"
                    : "bg-[#171c2a] border-gray-700/50 text-gray-300 hover:bg-[#1f2638] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                }`}
              >
                Send via SMS OTP
              </button>
            </div>
            
            {!userPhone && (
              <p className="text-[10px] text-gray-500 text-center">
                * SMS option is disabled because no phone number was registered.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
