"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface StockExpiryCategoryItem {
  name: string;
  value: number;
  batches?: number;
  percentage?: number;
  color: string;
}

export interface StockExpiryMonitorData {
  totalBatches?: number;
  totalUnits?: number;
  breakdown?: StockExpiryCategoryItem[];
  validYear?: { batches: number; units: number; color: string; label: string; percentage: number };
  safeShelf?: { batches: number; units: number; color: string; label: string; percentage: number };
  nearExpiry?: { batches: number; units: number; color: string; label: string; percentage: number };
  critical?: { batches: number; units: number; color: string; label: string; percentage: number };
}

interface StockExpiryMonitorCardProps {
  data?: StockExpiryMonitorData;
  totalBatches?: number;
  totalUnits?: number;
}

export function StockExpiryMonitorCard({
  data: monitorData,
  totalBatches: fallbackTotalBatches = 11,
  totalUnits: fallbackTotalUnits = 708,
}: StockExpiryMonitorCardProps) {
  const totalBatches = monitorData?.totalBatches ?? fallbackTotalBatches;
  const totalUnits = monitorData?.totalUnits ?? fallbackTotalUnits;

  const chartData = useMemo(() => {
    if (monitorData?.breakdown && monitorData.breakdown.length > 0) {
      const sum = monitorData.breakdown.reduce((acc, c) => acc + c.value, 0);
      return monitorData.breakdown
        .filter((item) => item.value > 0 || (item.batches && item.batches > 0))
        .map((c) => {
          const pct =
            typeof c.percentage === "number"
              ? c.percentage
              : sum > 0
              ? Math.round((c.value / sum) * 100)
              : 0;
          return {
            name: c.name,
            value: c.value,
            batches: c.batches,
            percentage: pct,
            color: c.color,
          };
        });
    }

    // Default stock expiry distribution matching user timeline rules:
    // - Dark Green (#00594C): Valid in stock (≥ 1 Year)
    // - Mint (#2DD4BF): Safe shelf (6–12 Months)
    // - Yellow (#EAB308): Near expiry (timeline 6 Months)
    // - Red (#DC2626): 1 Month left / Critical
    return [
      { name: "Valid (≥1 yr)", value: 440, batches: 6, percentage: 62, color: "#00594C" },
      { name: "Safe (6–12m)", value: 179, batches: 2, percentage: 25, color: "#2DD4BF" },
      { name: "Near exp (≤6m)", value: 65, batches: 2, percentage: 9, color: "#EAB308" },
      { name: "1 mo left", value: 24, batches: 1, percentage: 4, color: "#DC2626" },
    ];
  }, [monitorData]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-bold text-stone-900">
          Stock expiry monitor
        </CardTitle>
        <Link
          href="/expiry"
          className="text-[11px] font-semibold text-[#00594C] hover:underline"
        >
          Radar →
        </Link>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3">
          {/* Donut Chart with Center Total Lots (MedCounter style) */}
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text in Donut: Active Batches / Lots */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-base font-bold text-stone-900 leading-none">
                {totalBatches}
              </span>
              <span className="text-[9px] font-bold text-stone-600 uppercase tracking-wider mt-0.5">
                LOTS
              </span>
            </div>
          </div>

          {/* Legend on Right (MedCounter style) */}
          <div className="flex-1 space-y-2 min-w-0">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-stone-900 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <span className="font-bold text-stone-900">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-stone-600 w-7 text-right font-medium">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom micro-stat */}
        <div className="mt-4 pt-3 border-t border-[#EDE8DF] flex items-center justify-between text-xs">
          <span className="font-medium text-stone-700">Total units in stock</span>
          <span className="font-bold text-stone-900">{totalUnits.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Re-export alias for backward compatibility
export { StockExpiryMonitorCard as FormulationMixCard };
