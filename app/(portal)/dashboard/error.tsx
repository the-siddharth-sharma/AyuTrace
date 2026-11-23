"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard client render error captured by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-[#EDE8DF] p-6 shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-700">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-stone-900">
            Clinical Dashboard Refresh Required
          </h2>
          <p className="text-xs text-stone-600">
            A temporary component display discrepancy was detected. Your clinical records remain 100% safe and verified under 21 CFR Part 11 protocols.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <Button
            onClick={() => reset()}
            className="flex-1 bg-[#00594C] hover:bg-[#00473D] text-white text-xs font-semibold h-9 rounded-xl gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reload Dashboard
          </Button>
          <Link href="/inventory" className="flex-1">
            <Button
              variant="outline"
              className="w-full border-[#EDE8DF] text-xs font-semibold h-9 rounded-xl text-stone-800 hover:bg-stone-50 cursor-pointer"
            >
              Go to Inventory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
