"use client";

import React, { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  month: string;
  fullMonth?: string;
  dateKey?: string;
  units: number;
  batchCount?: number;
  medicines?: string[];
  hasExpiry?: boolean;
}

interface DashboardTrendCardProps {
  timelineData?: TimelineItem[];
  monthlyTimeline?: TimelineItem[];
}

export function DashboardTrendCard({
  timelineData = [],
  monthlyTimeline = [],
}: DashboardTrendCardProps) {
  const [rangeFilter, setRangeFilter] = useState<"7D" | "30D" | "90D" | "All">("All");

  // Format data for continuous smooth curve (MedCounter style)
  const chartData = useMemo(() => {
    const source = (monthlyTimeline && monthlyTimeline.length > 0) ? monthlyTimeline : timelineData;
    if (source.length === 0) {
      // Fallback sample points for smooth curve
      return [
        { label: "Aug", units: 120 },
        { label: "Sep", units: 260 },
        { label: "Oct", units: 180 },
        { label: "Nov", units: 340 },
        { label: "Dec", units: 520 },
        { label: "Jan", units: 753 },
      ];
    }

    if (rangeFilter === "7D") {
      return source.slice(-3).map((d) => ({ ...d, label: d.month }));
    }
    if (rangeFilter === "30D") {
      return source.slice(-6).map((d) => ({ ...d, label: d.month }));
    }
    if (rangeFilter === "90D") {
      return source.slice(-9).map((d) => ({ ...d, label: d.month }));
    }
    return source.map((d) => ({ ...d, label: d.month }));
  }, [monthlyTimeline, timelineData, rangeFilter]);

  const totalUnits = useMemo(() => {
    return chartData.reduce((acc, d) => acc + (d.units || 0), 0);
  }, [chartData]);

  const peakPoint = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((max, d) => (d.units > max.units ? d : max), chartData[0]);
  }, [chartData]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold text-stone-900">
              Stock & Expiry Trend
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 mt-0.5">
              {totalUnits.toLocaleString()} units projected across upcoming rotation horizons
              {peakPoint ? ` • Peak: ${peakPoint.label} (${peakPoint.units} units)` : ""}
            </CardDescription>
          </div>

          {/* Time Filter Pills (MedCounter Style) */}
          <div className="inline-flex rounded-xl bg-[#F6F4EE] border border-[#EDE8DF] p-0.5 text-xs self-start sm:self-auto">
            {(["7D", "30D", "90D", "All"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRangeFilter(r)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                  rangeFilter === r
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 pb-4 flex-1">
        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="medCounterTealGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00594C" stopOpacity={0.22} />
                  <stop offset="85%" stopColor="#00594C" stopOpacity={0.02} />
                  <stop offset="100%" stopColor="#00594C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: "#EDE8DF" }}
                tick={{ fontSize: 11, fill: "#78716C", fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#A8A29E" }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-[#EDE8DF] bg-white p-3 shadow-lg text-xs">
                        <p className="font-bold text-stone-900">{data.fullMonth || data.label}</p>
                        <p className="text-xs text-[#00594C] font-semibold mt-1">
                          {data.units} units scheduled
                        </p>
                        {data.batchCount ? (
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {data.batchCount} distinct batches
                          </p>
                        ) : null}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="units"
                stroke="#00594C"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#medCounterTealGrad)"
                activeDot={{ r: 5, fill: "#00594C", stroke: "#FFFFFF", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
