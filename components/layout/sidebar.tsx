"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Pill,
  Building2,
  ArrowLeftRight,
  ClockAlert,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { RoleLabels } from "@/lib/validations/auth";

interface SidebarProps {
  alertCount?: number;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  countColor?: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Alerts",
          href: "/expiry",
          icon: ClockAlert,
          count: alertCount > 0 ? alertCount : undefined,
          countColor: "bg-[#FEE2E2] text-[#B91C1C]",
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "AI Scanner",
          href: "/scanner",
          icon: ScanLine,
          badge: "Gemini",
        },
        {
          name: "Inventory",
          href: "/inventory",
          icon: Pill,
        },
        {
          name: "Transfers",
          href: "/transfers",
          icon: ArrowLeftRight,
        },
        {
          name: "Facilities",
          href: "/facilities",
          icon: Building2,
        },
      ],
    },
    {
      title: "INTELLIGENCE",
      items: [
        {
          name: "Analytics",
          href: "/analytics",
          icon: BarChart3,
        },
        {
          name: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[#EDE8DF] bg-white transition-all duration-200 ease-in-out select-none",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#EDE8DF]/80">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden group"
        >
          {/* Logo container */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00594C] text-white shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
            <Image
              src="/logo.png"
              alt="AyuTrace Logo"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-tight text-stone-900 leading-tight truncate">
                AyuTrace
              </span>
              <span className="text-[10px] font-medium text-stone-400 truncate">
                {user?.facility?.name || "Clinical Pharmacy"}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Main Nav with Sections */}
      <div className="flex-1 p-3 overflow-y-auto space-y-4">
        {/* Search Input (MedCounter Style) */}
        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search..."
              readOnly
              onClick={() => {
                const searchInput = document.getElementById("global-search");
                if (searchInput) searchInput.focus();
              }}
              className="w-full pl-8 pr-8 py-1.5 bg-[#F6F4EE] text-xs text-stone-700 placeholder-stone-400 rounded-xl border border-[#EDE8DF] outline-none cursor-pointer hover:bg-[#F2EFE7] transition-colors"
            />
            <span className="absolute right-2.5 top-2 text-[10px] text-stone-400 font-mono">⌘K</span>
          </div>
        )}

        {/* Section Groups */}
        {navSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {!isCollapsed && (
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-medium transition-all",
                      isActive
                        ? "bg-[#EAF5F2] text-[#00594C] font-semibold"
                        : "text-stone-600 hover:bg-[#F6F4EE] hover:text-stone-900"
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive
                          ? "text-[#00594C]"
                          : "text-stone-400 group-hover:text-stone-600"
                      )}
                    />
                    {!isCollapsed && (
                      <div className="flex flex-1 items-center justify-between overflow-hidden">
                        <span className="truncate">{item.name}</span>
                        {item.count !== undefined && (
                          <span
                            className={cn(
                              "ml-auto rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                              item.countColor || "bg-[#FEE2E2] text-[#B91C1C]"
                            )}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span className="ml-auto rounded-md bg-[#EAF5F2] text-[#00594C] px-1.5 py-0.5 text-[9px] font-bold tracking-wide">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Controls: Collapse & Sign Out */}
      <div className="p-3 border-t border-[#EDE8DF] space-y-1 bg-[#FAF8F5]/60">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-[#F4F1EA] hover:text-stone-800 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0 text-stone-400" />
              <span>« Collapse</span>
            </>
          )}
        </button>

        {user ? (
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        ) : (
          <Link
            href="/login"
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#00594C] hover:bg-[#EAF5F2] transition-colors"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!isCollapsed && <span>Sign In</span>}
          </Link>
        )}
      </div>
    </aside>
  );
}
