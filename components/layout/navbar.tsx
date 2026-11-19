"use client";

import React from "react";
import Link from "next/link";
import {
  Bell,
  ScanLine,
  Building2,
  Calendar,
  Shield,
  LogOut,
  User as UserIcon,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { RoleLabels } from "@/lib/validations/auth";
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
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const { facilities } = useFacilities();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs">
      {/* Free space on the front navbar */}
      <div className="flex-1" />

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Facility Selector */}
        {facilities.length > 0 && onFacilityChange && (
          <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs shrink-0">
            <Building2 className="h-3.5 w-3.5 text-teal-700 shrink-0" />
            <select
              value={selectedFacilityId}
              onChange={(e) => onFacilityChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
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

        {/* Date Display (Strictly horizontal, non-wrapping) */}
        <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg px-3 py-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="whitespace-nowrap">{formattedDate}</span>
        </div>

        {/* Organization Tag */}
        <div className="hidden md:flex items-center gap-1.5 whitespace-nowrap shrink-0 text-xs font-semibold text-teal-900 bg-teal-50 border border-teal-200/70 rounded-lg px-2.5 py-1.5">
          <Shield className="h-3.5 w-3.5 text-teal-700 shrink-0" />
          <span className="truncate max-w-[150px]">{orgName}</span>
        </div>

        {/* Expiry Alert Bell */}
        <Link
          href="/expiry"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
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

        {/* Primary CTA: Scan Medicine */}
        <Link href="/scanner">
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-teal-700 hover:bg-teal-800">
            <ScanLine className="h-3.5 w-3.5" />
            <span>Scan Medicine</span>
          </Button>
        </Link>

        {/* User Account / Authentication Controls */}
        {!isAuthLoading && (
          <div className="flex items-center pl-1 border-l border-slate-200/80">
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-left"
                  title={`Logged in as ${user.name} (${user.email})`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white uppercase">
                    {user.name.slice(0, 2)}
                  </div>
                  <div className="hidden xl:flex flex-col">
                    <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-teal-700 font-medium leading-none">
                      {RoleLabels[user.role] || user.role}
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logout()}
                  className="h-8 px-2 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  title="Sign out of AyuTrace"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs ml-1">Sign Out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-slate-700">
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-teal-600 text-teal-700 hover:bg-teal-50">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Make Account</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
