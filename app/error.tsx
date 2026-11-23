"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global client application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE8DF] p-6 shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-stone-900">
            AyuTrace Session Alert
          </h2>
          <p className="text-xs text-stone-600">
            An unexpected client-side state occurred. Your clinical data and lot compliance remain intact.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-[#00594C] hover:bg-[#00473D] text-white text-xs font-semibold h-9 rounded-xl gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
          <Link href="/login" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#EDE8DF] text-xs font-semibold h-9 rounded-xl text-stone-800 hover:bg-stone-50 cursor-pointer gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
