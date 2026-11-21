"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Step 1: "request_otp" | Step 2: "verify_reset" | Step 3: "success"
  const [step, setStep] = useState<"request_otp" | "verify_reset" | "success">("request_otp");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Resend OTP countdown timer
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Request OTP from server
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid work or hospital email address.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to send verification OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessNotice(data.message || "A 6-digit code has been sent to your email.");
      setStep("verify_reset");
      setCountdown(60); // 60s cooldown for resend
      setIsLoading(false);
    } catch (err) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  // Verify OTP and Reset Password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setErrorMessage("Please enter the complete 6-digit OTP received in your email.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: cleanOtp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to reset password. Please check the OTP.");
        setIsLoading(false);
        return;
      }

      setStep("success");
      setIsLoading(false);
    } catch (err) {
      setErrorMessage("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to resend code.");
        setIsLoading(false);
        return;
      }

      setSuccessNotice("A new 6-digit verification code has been dispatched.");
      setCountdown(60);
      setIsLoading(false);
    } catch (err) {
      setErrorMessage("Network error while resending OTP.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[#F8F7F4] py-12 px-4 sm:px-6 lg:px-8">
      {/* AyuTrace Header Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 transition-transform hover:scale-105"
        >
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl shadow-md shadow-teal-800/15">
            <Image
              src="/logo.png"
              alt="AyuTrace Logo"
              width={48}
              height={48}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <div className="text-left">
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              AyuTrace
            </div>
            <div className="text-[10px] font-bold tracking-wider uppercase text-teal-700">
              Clinical Drug Traceability
            </div>
          </div>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-stone-900">
          {step === "success"
            ? "Password Reset Complete"
            : step === "verify_reset"
            ? "Enter Verification OTP"
            : "Reset Account Password"}
        </h2>
        <p className="mt-1.5 text-sm font-medium text-stone-600">
          {step === "success"
            ? "Your clinical credentials have been updated securely."
            : step === "verify_reset"
            ? `Enter the 6-digit security code sent to ${email}`
            : "Enter your registered email to receive a secure one-time verification code."}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-[#EDE8DF] shadow-xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-sm font-medium text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          {/* Success Notice Banner */}
          {successNotice && step === "verify_reset" && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-sm font-medium text-teal-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
              <div className="flex-1 font-semibold">{successNotice}</div>
            </div>
          )}

          {/* STEP 1: Enter Email & Request OTP */}
          {step === "request_otp" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-stone-800 mb-1.5"
                >
                  Registered Work / Hospital Email
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@hospital.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm h-10 font-medium text-stone-900 rounded-xl"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 bg-[#00594C] hover:bg-[#00473D] text-white font-semibold py-2.5 rounded-xl shadow-xs text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending security code...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-sm">
                    <span>Send Verification Code (OTP)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </Button>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: Enter OTP & New Password */}
          {step === "verify_reset" && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-slate-700"
                  >
                    6-Digit Security OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request_otp");
                      setErrorMessage(null);
                      setSuccessNotice(null);
                    }}
                    className="text-xs text-teal-700 hover:text-teal-800 font-semibold"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="pl-9 font-mono tracking-widest text-base font-bold text-slate-900 h-10"
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-xs">
                  <span className="text-slate-500">Sent via Gmail SMTP</span>
                  {countdown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Resend available in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-9 text-sm h-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-sm h-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 bg-[#00594C] hover:bg-[#00473D] text-white font-semibold py-2.5 rounded-xl shadow-xs text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Updating password...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-sm">
                    <span>Reset Password & Secure Account</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                )}
              </Button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep("request_otp");
                    setErrorMessage(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-700 hover:text-stone-950 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Email Entry</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === "success" && (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-[#00594C]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  Password Updated Successfully
                </h3>
                <p className="mt-1 text-sm font-medium text-stone-600">
                  Your new credentials are now active and all previous sessions have been securely terminated.
                </p>
              </div>
              <Link href="/login" className="block pt-2">
                <Button className="w-full gap-2 bg-[#00594C] hover:bg-[#00473D] text-white font-semibold py-2.5 rounded-xl shadow-xs text-sm">
                  <span>Sign In to AyuTrace</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Clinical Compliance Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs font-medium text-stone-500">
          <ShieldCheck className="h-4 w-4 text-[#00594C]" />
          <span>Statutory Batch Expiry Verification Protocol • 21 CFR Part 11</span>
        </div>
      </div>
    </div>
  );
}
