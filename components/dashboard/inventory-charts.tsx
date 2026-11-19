"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar, BarChart3, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
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

interface ChartProps {
  facilityData: Array<{ facility: string; type: string; units: number }>;
  riskData: Array<{ name: string; count: number; color: string }>;
  timelineData: TimelineItem[];
  monthlyTimeline?: TimelineItem[];
}

export function InventoryCharts({
  facilityData,
  riskData,
  timelineData = [],
  monthlyTimeline = [],
}: ChartProps) {
  const hasFacilityData = facilityData.length > 0 && facilityData.some((f) => f.units > 0);
  const hasTimelineData = timelineData.length > 0;

  // Toggle between consecutive monthly timeline vs active milestone peaks
  const [timelineMode, setTimelineMode] = useState<"monthly" | "milestones">("monthly");
  // Toggle between smooth Area curve vs discrete Monthly Volume Bars
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  // Optional selected month filter/highlight
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Derive active dataset based on mode
  const activeTimeline = useMemo(() => {
    if (timelineMode === "milestones") {
      return timelineData;
    }

    if (monthlyTimeline && monthlyTimeline.length > 0) {
      return monthlyTimeline;
    }

    // Fallback: auto-interpolate consecutive calendar months from timelineData
    if (timelineData.length === 0) return [];

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parsed = timelineData.map((d) => {
      const parts = d.month.trim().split(" ");
      const mIdx = monthNames.indexOf(parts[0]);
      const year = 2000 + parseInt(parts[1] || "26", 10);
      return {
        ...d,
        year,
        mIdx: mIdx >= 0 ? mIdx : 0,
      };
    });

    parsed.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.mIdx - b.mIdx));

    const first = parsed[0];
    const last = parsed[parsed.length - 1];
    const cursor = new Date(first.year, first.mIdx, 1);
    const end = new Date(last.year, last.mIdx, 1);

    const generated: TimelineItem[] = [];
    while (cursor <= end) {
      const mLabel = cursor.toLocaleString("en-US", { month: "short", year: "2-digit" });
      const fullLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });
      const match = timelineData.find((t) => t.month === mLabel);

      generated.push({
        month: mLabel,
        fullMonth: fullLabel,
        units: match ? match.units : 0,
        batchCount: match?.batchCount || (match && match.units > 0 ? 1 : 0),
        hasExpiry: Boolean(match && match.units > 0),
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return generated;
  }, [timelineMode, timelineData, monthlyTimeline]);

  // Overall horizon metrics
  const totalHorizonUnits = useMemo(() => {
    return timelineData.reduce((acc, curr) => acc + curr.units, 0);
  }, [timelineData]);

  const peakMonth = useMemo(() => {
    if (timelineData.length === 0) return null;
    return timelineData.reduce((max, curr) => (curr.units > max.units ? curr : max), timelineData[0]);
  }, [timelineData]);

  const activeMilestonesCount = useMemo(() => {
    return timelineData.filter((d) => d.units > 0).length;
  }, [timelineData]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Inventory by Facility Chart (6 cols) */}
      <Card className="lg:col-span-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900">
            Stock Distribution by Facility
          </CardTitle>
          <CardDescription className="text-xs">
            Physical stock allocation across registered hospital units and clinics
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-3">
          {hasFacilityData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis
                  dataKey="facility"
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <Tooltip
                  formatter={(val: number) => [`${val} packs`, "Stock In Hand"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="units" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">No facility stock records logged.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Expiry Risk Health Donut (6 cols) */}
      <Card className="lg:col-span-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-900">
            Batch Expiry Risk Proximity
          </CardTitle>
          <CardDescription className="text-xs">
            Batch breakdown by statutory cutoff horizons and verification state
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 pt-3">
          {riskData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${val} batches`, "Batches"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-[11px] text-slate-600 font-medium">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">No active batches to evaluate.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiry Timeline Exposure (12 cols) with Monthly Numbers and Granularity Toggles */}
      <Card className="lg:col-span-12">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  Future Expiry Horizon Timeline
                </CardTitle>
                <span className="rounded-full bg-teal-50 border border-teal-200/80 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                  {timelineMode === "monthly" ? "Continuous Monthly" : "Active Milestones"}
                </span>
              </div>
              <CardDescription className="text-xs mt-0.5">
                {timelineMode === "monthly"
                  ? "Month-by-month projected expiration volume across upcoming consecutive calendar months"
                  : "Targeted statutory drug expiration milestones across upcoming calendar lots"}
              </CardDescription>
            </div>

            {/* Granularity & Visual Mode Toggles */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {/* Monthly vs Milestones Mode Toggle */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setTimelineMode("monthly")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    timelineMode === "monthly"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>Monthly View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTimelineMode("milestones")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    timelineMode === "milestones"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  <TrendingUp className="h-3 w-3" />
                  <span>Milestones</span>
                </button>
              </div>

              {/* Chart Style Toggle: Area vs Bars */}
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartType("area")}
                  className={cn(
                    "p-1 rounded-md transition-all cursor-pointer",
                    chartType === "area"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Smooth Horizon Curve"
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "p-1 rounded-md transition-all cursor-pointer",
                    chartType === "bar"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Monthly Volume Bars"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics KPI Sub-strip */}
          {hasTimelineData && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Horizon Expiry</span>
                <span className="text-sm font-bold text-slate-900">{totalHorizonUnits.toLocaleString()} units</span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Peak Expiry Month</span>
                <span className="text-sm font-bold text-teal-800">
                  {peakMonth ? `${peakMonth.month} (${peakMonth.units} units)` : "—"}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Active Expiry Milestones</span>
                <span className="text-sm font-bold text-slate-900">{activeMilestonesCount} months</span>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200/60 p-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Timeline Scope</span>
                <span className="text-sm font-bold text-slate-900">{activeTimeline.length} calendar months</span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {hasTimelineData ? (
            <div className="space-y-4">
              {/* Main Graphic Rendering */}
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === "area" ? (
                    <AreaChart
                      data={activeTimeline}
                      margin={{ top: 15, right: 20, left: -15, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="expiryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        interval={activeTimeline.length > 18 ? 1 : 0}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as TimelineItem;
                            return (
                              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                                <div className="font-bold text-slate-900 mb-1">
                                  {data.fullMonth || data.month}
                                </div>
                                <div className="flex items-center justify-between gap-4 text-slate-600">
                                  <span>Units Expiring:</span>
                                  <span className="font-bold text-teal-800 font-mono">
                                    {data.units} units
                                  </span>
                                </div>
                                {data.batchCount !== undefined && data.batchCount > 0 && (
                                  <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px] mt-0.5">
                                    <span>Active Batches:</span>
                                    <span className="font-semibold text-slate-800">
                                      {data.batchCount} batch{data.batchCount > 1 ? "es" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="units"
                        stroke="#0d9488"
                        strokeWidth={2.5}
                        fill="url(#expiryGradient)"
                        dot={{ r: 3, fill: "#0d9488", strokeWidth: 1 }}
                        activeDot={{ r: 5, fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={activeTimeline}
                      margin={{ top: 20, right: 20, left: -15, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        interval={activeTimeline.length > 18 ? 1 : 0}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={{ stroke: "#e2e8f0" }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as TimelineItem;
                            return (
                              <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs">
                                <div className="font-bold text-slate-900 mb-1">
                                  {data.fullMonth || data.month}
                                </div>
                                <div className="flex items-center justify-between gap-4 text-slate-600">
                                  <span>Units Expiring:</span>
                                  <span className="font-bold text-teal-800 font-mono">
                                    {data.units} units
                                  </span>
                                </div>
                                {data.batchCount !== undefined && data.batchCount > 0 && (
                                  <div className="flex items-center justify-between gap-4 text-slate-500 text-[11px] mt-0.5">
                                    <span>Active Batches:</span>
                                    <span className="font-semibold text-slate-800">
                                      {data.batchCount} batch{data.batchCount > 1 ? "es" : ""}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="units"
                        fill="#0d9488"
                        radius={[4, 4, 0, 0]}
                      >
                        <LabelList
                          dataKey="units"
                          position="top"
                          formatter={(val: number) => (val > 0 ? val : "")}
                          className="text-[10px] font-bold fill-teal-900 font-mono"
                        />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Monthly Numbers Breakdown Strip */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Monthly Breakdown ({activeTimeline.length} Months)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click any month to inspect details
                  </span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {activeTimeline.map((item) => {
                    const isSelected = selectedMonth === item.month;
                    const hasUnits = item.units > 0;

                    return (
                      <div
                        key={item.month}
                        onClick={() => setSelectedMonth(isSelected ? null : item.month)}
                        className={cn(
                          "shrink-0 rounded-lg border px-3 py-1.5 transition-all cursor-pointer select-none text-center min-w-[76px]",
                          isSelected
                            ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500/20 shadow-xs"
                            : hasUnits
                            ? "border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 opacity-70"
                        )}
                        title={`${item.fullMonth || item.month}: ${item.units} units`}
                      >
                        <div className="text-[10px] font-bold text-slate-600 uppercase">
                          {item.month}
                        </div>
                        <div
                          className={cn(
                            "text-xs font-bold font-mono mt-0.5",
                            hasUnits ? "text-teal-900" : "text-slate-400"
                          )}
                        >
                          {item.units > 0 ? `${item.units}` : "0"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400">No scheduled future expirations found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
