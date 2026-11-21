"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  ScanLine,
  Building2,
  Calendar,
  Shield,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useFacilities } from "@/lib/hooks/use-swr-api";

interface NavbarProps {
  alertCount?: number;
  orgName?: string;
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
}

export function Navbar({
  alertCount = 0,
  orgName = "AyuTrace Health Network",
  selectedFacilityId = "all",
  onFacilityChange,
}: NavbarProps) {
  const { user } = useAuth();
  const { facilities } = useFacilities();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#EDE8DF] bg-[#F8F7F4]/95 px-5 sm:px-7 backdrop-blur-xs">
      {/* Search Bar / Location breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
          <Calendar className="h-3.5 w-3.5 text-stone-400" />
          <span className="font-medium">{formattedDate}</span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-400">Clinical session verified</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Facility Selector */}
        {facilities.length > 0 && onFacilityChange && (
          <div className="flex items-center gap-1.5 rounded-xl border border-[#EDE8DF] bg-white px-2.5 py-1 text-xs shadow-2xs">
            <Building2 className="h-3.5 w-3.5 text-[#00594C] shrink-0" />
            <select
              value={selectedFacilityId}
              onChange={(e) => onFacilityChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-stone-800 outline-none cursor-pointer pr-1"
            >
              <option value="all">All Facilities ({facilities.length})</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Expiry Alert Bell */}
        <Link
          href="/expiry"
          className="relative rounded-xl border border-[#EDE8DF] bg-white p-2 text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors shadow-2xs"
          title={`${alertCount} medicine batches require attention or quarantine`}
        >
          <Bell className="h-4 w-4" />
          {alertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
            </span>
          )}
        </Link>

        {/* Quick Action: Scan Medicine */}
        <Link href="/scanner">
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-[#00594C] hover:bg-[#00473D] text-white rounded-xl shadow-xs px-3">
            <ScanLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Scan Medicine</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
