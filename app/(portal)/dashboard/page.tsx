"use client";

import React from "react";
import Link from "next/link";
import {
  ScanLine,
  RefreshCw,
  Plus,
  ArrowLeftRight,
  PackagePlus,
  Moon,
  ClockAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardTrendCard } from "@/components/dashboard/dashboard-trend-card";
import { DashboardRadarCard } from "@/components/dashboard/dashboard-radar-card";
import { TopMedicinesCard } from "@/components/dashboard/top-medicines-card";
import { StockExpiryMonitorCard } from "@/components/dashboard/stock-expiry-monitor-card";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { useStats } from "@/lib/hooks/use-swr-api";
import { useAuth } from "@/lib/auth/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();
  const { stats, isValidating, mutate } = useStats();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good morning"
      : currentHour < 17
      ? "Good afternoon"
      : "Good evening";

  const targetName = user?.facility?.name || (user?.name ? `${user.name}'s Ward` : "AyuTrace Pharmacy");
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const hasUrgentAlerts = Boolean(
    (stats?.expiredBatches && stats.expiredBatches > 0) ||
    (stats?.urgentBatches && stats.urgentBatches > 0)
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. MedCounter Greeting Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            {greeting}, {targetName}
          </h1>
          <p className="text-xs font-medium text-stone-600 mt-0.5">
            {formattedDate} • clinical counter open • {stats?.trackingFacilities || 1} storage unit{(stats?.trackingFacilities || 1) > 1 ? "s" : ""} verified
          </p>
        </div>

        {/* Quick Action Buttons (MedCounter Style) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh button */}
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isValidating}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE8DF] bg-white text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            title="Refresh clinical metrics"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isValidating ? "animate-spin text-[#00594C]" : ""}`}
            />
          </button>

          {/* Stock Intake (Receive Order) */}
          <Link href="/inventory">
            <button
              type="button"
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#EDE8DF] bg-white text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              <PackagePlus className="h-3.5 w-3.5 text-stone-600" />
              <span>Receive intake</span>
            </button>
          </Link>

          {/* Stock Transfer */}
          <Link href="/transfers">
            <button
              type="button"
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-[#EDE8DF] bg-white text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
            >
              <ArrowLeftRight className="h-3.5 w-3.5 text-stone-600" />
              <span>Transfer stock</span>
            </button>
          </Link>

          {/* Primary CTA: Scan Medicine (MedCounter "+ New bill" style) */}
          <Link href="/scanner">
            <button
              type="button"
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#00594C] hover:bg-[#00473D] text-xs font-semibold text-white transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Scan Medicine</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Optional Alert Banner for Expired/Urgent Stock */}
      {hasUrgentAlerts && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-300 bg-rose-50/90 p-3 sm:px-4 text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <ClockAlert className="h-4 w-4 text-rose-700 shrink-0" />
            <span className="font-semibold">
              Statutory Expiry Alert: {(stats?.expiredBatches || 0) + (stats?.urgentBatches || 0)} batch{(stats?.expiredBatches || 0) + (stats?.urgentBatches || 0) > 1 ? "es" : ""} requiring immediate rotation or quarantine.
            </span>
          </div>
          <Link
            href="/expiry"
            className="text-xs font-bold text-rose-800 hover:underline shrink-0 ml-3"
          >
            Review in Radar →
          </Link>
        </div>
      )}

      {/* 2. Top Row: 4 Metric Cards */}
      <KpiCards
        registeredMedicines={stats?.registeredMedicines || 0}
        totalStockUnits={stats?.totalStockUnits || 0}
        activeBatches={stats?.activeBatches || 0}
        nearExpiryBatches={stats?.nearExpiryBatches || 0}
        expiredBatches={stats?.expiredBatches || 0}
        trackingFacilities={stats?.trackingFacilities || 1}
      />

      {/* 3. Middle Row: Sales Trend (Left 8 cols) + Status Summary (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="lg:col-span-8">
          <DashboardTrendCard
            timelineData={stats?.expiryTimeline || []}
            monthlyTimeline={stats?.monthlyTimeline || []}
          />
        </div>
        <div className="lg:col-span-4">
          <DashboardRadarCard
            expiredBatches={stats?.expiredBatches || 0}
            nearExpiryBatches={stats?.nearExpiryBatches || 0}
            validBatches={stats?.validBatches || 0}
            unverifiedCount={stats?.unverifiedCount || 0}
            activeTransfersCount={3}
          />
        </div>
      </div>

      {/* 4. Bottom Row: Top Medicines (5 cols) + Formulation Mix (3.5 cols) + Recent Activity (3.5 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        <div className="md:col-span-12 lg:col-span-5">
          <TopMedicinesCard medicines={(stats as any)?.topMedicines || []} />
        </div>
        <div className="md:col-span-6 lg:col-span-3">
          <StockExpiryMonitorCard
            data={(stats as any)?.stockExpiryMonitor}
            totalBatches={stats?.activeBatches || 0}
            totalUnits={stats?.totalStockUnits || 0}
          />
        </div>
        <div className="md:col-span-6 lg:col-span-4">
          <RecentActivityCard movements={stats?.recentStockMovements || []} />
        </div>
      </div>
    </div>
  );
}
