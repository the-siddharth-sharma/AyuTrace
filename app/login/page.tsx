"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";

export default function LoginPage() {
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Authentication failed. Please verify credentials.");
        setIsLoading(false);
        return;
      }

      // Update auth context state and perform a clean browser navigation to dashboard
      login(data.user);
      window.location.href = "/dashboard";
    } catch (err) {
      setErrorMessage("Network or connection error. Please try again.");
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
          Sign in to your clinical account
        </h2>
        <p className="mt-1.5 text-sm font-medium text-stone-600">
          Statutory medicine inventory, lot traceability & FEFO dispatch controls
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-[#EDE8DF] shadow-xl bg-white/95 backdrop-blur-sm p-6 sm:p-8 rounded-2xl">
          {/* Active Session Notice Banner */}
          {user && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-3 text-xs text-teal-950 animate-in fade-in">
              <div className="flex items-center gap-2 min-w-0">
                <UserCheck className="h-4 w-4 text-teal-700 shrink-0" />
                <span className="truncate">
                  Signed in as <strong className="font-semibold">{user.name}</strong>
                </span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 font-bold text-teal-800 hover:text-teal-900 underline underline-offset-2 shrink-0 text-xs"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-semibold">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-stone-800 mb-1.5"
              >
                Work / Hospital Email
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
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-stone-800"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-[#00594C] hover:text-[#00473D] font-semibold hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-sm h-10 font-medium text-stone-900 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-stone-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-stone-300 text-[#00594C] focus:ring-[#00594C] cursor-pointer"
                />
                <span>Remember this workstation</span>
              </label>
              <Badge variant="neutral" className="text-xs font-semibold py-0.5">
                GAMP 5 Audited
              </Badge>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 bg-[#00594C] hover:bg-[#00473D] text-white font-semibold py-2.5 rounded-xl shadow-xs text-sm"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Verifying credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-sm">
                  <span>Sign In to AyuTrace</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          {/* Link to Make Account */}
          <div className="mt-6 text-center text-sm font-medium text-stone-700 border-t border-[#EDE8DF] pt-4">
            Need access to AyuTrace?{" "}
            <Link
              href="/register"
              className="font-bold text-[#00594C] hover:text-[#00473D] underline underline-offset-2"
            >
              Make an Account
            </Link>
          </div>
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
