"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeftRight, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardRadarCardProps {
  expiredBatches: number;
  nearExpiryBatches: number;
  validBatches: number;
  unverifiedCount: number;
  activeTransfersCount?: number;
}

export function DashboardRadarCard({
  expiredBatches = 0,
  nearExpiryBatches = 0,
  validBatches = 0,
  unverifiedCount = 0,
  activeTransfersCount = 3,
}: DashboardRadarCardProps) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. Statutory Compliance & Transfer Status (MedCounter style quick-action card) */}
      <Card className="p-4 sm:p-4.5 space-y-3">
        {/* Compliance Row */}
        <Link
          href="/settings"
          className="flex items-center justify-between group p-1 -m-1 rounded-xl hover:bg-[#F9F8F5] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-900 group-hover:text-[#00594C] transition-colors">
                21 CFR Part 11 Protocol
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                GAMP 5 continuous audit active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-right shrink-0">
            <span className="text-xs font-bold text-stone-800">100%</span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>

        {/* Divider */}
        <div className="border-t border-[#EDE8DF]/70" />

        {/* Inter-Facility Transfers Row */}
        <Link
          href="/transfers"
          className="flex items-center justify-between group p-1 -m-1 rounded-xl hover:bg-[#F9F8F5] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100 text-[#00594C]">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-stone-900 group-hover:text-[#00594C] transition-colors">
                Inter-Facility Transfers
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                Clinical chain-of-custody log
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-right shrink-0">
            <span className="text-xs font-bold text-stone-800">{activeTransfersCount} active</span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-stone-700 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      </Card>

      {/* 2. Clinical Expiry Radar / Stock Status (MedCounter style dot status list) */}
      <Card className="p-4 sm:p-4.5 space-y-3">
        <div className="space-y-2.5">
          {/* Expired / Blocked */}
          <Link
            href="/expiry"
            className="flex items-center justify-between text-xs py-1 px-1 -mx-1 rounded-lg hover:bg-[#F9F8F5] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
              <span className="font-medium text-stone-700 group-hover:text-stone-900">
                Expired (Blocked)
              </span>
            </div>
            <span className={expiredBatches > 0 ? "font-bold text-rose-600" : "font-semibold text-stone-400"}>
              {expiredBatches}
            </span>
          </Link>

          {/* Expiring <=90 days */}
          <Link
            href="/expiry"
            className="flex items-center justify-between text-xs py-1 px-1 -mx-1 rounded-lg hover:bg-[#F9F8F5] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span className="font-medium text-stone-700 group-hover:text-stone-900">
                Expiring ≤90 days
              </span>
            </div>
            <span className={nearExpiryBatches > 0 ? "font-bold text-amber-700" : "font-semibold text-stone-400"}>
              {nearExpiryBatches}
            </span>
          </Link>

          {/* Safe Shelf */}
          <Link
            href="/inventory"
            className="flex items-center justify-between text-xs py-1 px-1 -mx-1 rounded-lg hover:bg-[#F9F8F5] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#10B981] shrink-0" />
              <span className="font-medium text-stone-700 group-hover:text-stone-900">
                Safe Shelf Stock
              </span>
            </div>
            <span className="font-semibold text-stone-800">
              {validBatches}
            </span>
          </Link>

          {/* Unverified */}
          {unverifiedCount > 0 && (
            <Link
              href="/expiry"
              className="flex items-center justify-between text-xs py-1 px-1 -mx-1 rounded-lg hover:bg-[#F9F8F5] transition-colors group"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-medium text-stone-700 group-hover:text-stone-900">
                  Unverified / Intake
                </span>
              </div>
              <span className="font-bold text-slate-600">
                {unverifiedCount}
              </span>
            </Link>
          )}
        </div>

        {/* View all link */}
        <div className="pt-2 border-t border-[#EDE8DF]/70">
          <Link
            href="/expiry"
            className="text-xs font-semibold text-[#00594C] hover:text-[#00473D] flex items-center justify-between group"
          >
            <span>View Expiry Radar</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Card>
    </div>
  );
}
