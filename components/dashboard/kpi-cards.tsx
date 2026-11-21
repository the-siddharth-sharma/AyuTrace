"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardsProps {
  registeredMedicines: number;
  totalStockUnits: number;
  activeBatches: number;
  nearExpiryBatches: number;
  expiredBatches: number;
  trackingFacilities: number;
}

export function KpiCards({
  registeredMedicines,
  totalStockUnits,
  activeBatches,
  nearExpiryBatches,
  expiredBatches,
  trackingFacilities,
}: KpiCardsProps) {
  const cards = [
    {
      title: "RECORDED STOCK UNITS",
      value: totalStockUnits.toLocaleString(),
      subtitle: `Across ${trackingFacilities} clinical storage units`,
      href: "/inventory",
      sparkColor: "#00594C",
      hasWarning: false,
    },
    {
      title: "ACTIVE BATCHES",
      value: activeBatches.toLocaleString(),
      subtitle: "100% GAMP 5 audited lots",
      href: "/inventory",
      sparkColor: "#00594C",
      hasWarning: false,
    },
    {
      title: "EXPIRING SOON (≤90D)",
      value: nearExpiryBatches.toLocaleString(),
      subtitle: "FEFO rotation priority queue",
      href: "/expiry",
      sparkColor: nearExpiryBatches > 0 ? "#F59E0B" : "#00594C",
      hasWarning: nearExpiryBatches > 0,
      badge: nearExpiryBatches > 0 ? `${nearExpiryBatches} urgent` : undefined,
    },
    {
      title: "DRUG FORMULATIONS",
      value: registeredMedicines.toLocaleString(),
      subtitle: "Unique clinical items tracked",
      href: "/inventory",
      sparkColor: "#00594C",
      hasWarning: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Link key={card.title} href={card.href} className="group block">
          <Card className="p-4 sm:p-5 hover:border-stone-300 hover:shadow-xs transition-all relative overflow-hidden">
            {/* Top row: Label & Mini Sparkline Wave (MedCounter Style) */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                {card.title}
              </span>

              {/* Minimalist Sparkline Wave */}
              <div className="h-5 w-12 shrink-0">
                <svg
                  viewBox="0 0 50 20"
                  fill="none"
                  className="h-full w-full stroke-current"
                  style={{ color: card.sparkColor }}
                >
                  <path
                    d={
                      card.hasWarning
                        ? "M1 15 Q 12 5, 25 10 T 49 4"
                        : "M1 16 Q 15 16, 25 14 T 49 3"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* Middle: Big Stat Number */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                  {card.badge}
                </span>
              )}
            </div>

            {/* Bottom: Subtitle / Comparison */}
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-400">
              <span className="truncate">{card.subtitle}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
