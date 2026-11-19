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
import { Building2, Pill, ShieldAlert, AlertTriangle, Calendar, TrendingUp, BarChart3 } from "lucide-react";
import { useStats } from "@/lib/hooks/use-swr-api";
import { cn } from "@/lib/utils";

export function AnalyticsView() {
  const { stats, isLoading } = useStats();
  const [timelineMode, setTimelineMode] = useState<"monthly" | "milestones">("monthly");
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const facilityData = stats?.inventoryByFacility || [];
  const categoryData = stats?.quantityByCategory || [];
  const dosageData = stats?.quantityByDosageForm || [];
  const riskData = stats?.riskDistribution || [];
  const timelineData = stats?.expiryTimeline || [];
  const monthlyTimeline = stats?.monthlyTimeline || [];

  const activeTimeline = useMemo(() => {
    if (timelineMode === "milestones") {
      return timelineData;
    }
    return monthlyTimeline.length > 0 ? monthlyTimeline : timelineData;
  }, [timelineMode, timelineData, monthlyTimeline]);

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-slate-400">Loading pharmaceutical analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* High-Level Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Medicines</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalStockUnits || 0}</p>
          <p className="text-[11px] text-slate-400">Packs across {stats?.registeredMedicines || 0} registered lines</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Lots</span>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.activeBatches || 0}</p>
          <p className="text-[11px] text-slate-400">Independent batches tracked</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-amber-700 uppercase">Expiry Exposure (≤90d)</span>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {(stats?.nearExpiryBatches || 0) + (stats?.criticalBatches || 0) + (stats?.urgentBatches || 0)}
          </p>
          <p className="text-[11px] text-amber-600">Batches needing priority rotation</p>
        </Card>

        <Card className="p-4">
          <span className="text-xs font-bold text-rose-700 uppercase">Quarantined / Expired</span>
          <p className="mt-1 text-2xl font-bold text-rose-700">{stats?.expiredBatches || 0}</p>
          <p className="text-[11px] text-rose-600">Blocked from patient dispensing</p>
        </Card>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Medicine Inventory by Facility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-teal-700" />
              Stock Volume by Facility
            </CardTitle>
            <CardDescription className="text-xs">
              Physical packs registered across hospital wards and clinics
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {facilityData.length > 0 ? (
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
                    formatter={(val: number) => [`${val} units`, "Stock"]}
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
                <p className="text-xs text-slate-400">No facility data logged.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quantity by Dosage Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="h-4 w-4 text-teal-700" />
              Stock by Dosage Form
            </CardTitle>
            <CardDescription className="text-xs">
              Breakdown across tablets, capsules, syrups, and injections
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {dosageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dosageData} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis dataKey="form" type="category" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(val: number) => [`${val} units`, "Units"]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="units" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <p className="text-xs text-slate-400">No dosage records logged.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Future Expiry Timeline Exposure (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-teal-700" />
                  <span>Future Expiry Exposure Curve</span>
                  <span className="rounded-full bg-teal-50 border border-teal-200/80 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                    {timelineMode === "monthly" ? "Continuous Monthly" : "Active Milestones"}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Projected stock volume reaching statutory expiration over upcoming calendar months
                </CardDescription>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-2">
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
                    <span>Monthly</span>
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
                    title="Area Curve"
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
                    title="Monthly Bars"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {activeTimeline.length > 0 ? (
              <div className="space-y-4">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "area" ? (
                      <AreaChart
                        data={activeTimeline}
                        margin={{ top: 15, right: 20, left: -15, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="analyticsExpiryGradient" x1="0" y1="0" x2="0" y2="1">
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
                              const data = payload[0].payload;
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
                                      <span>Batches:</span>
                                      <span className="font-semibold text-slate-800">
                                        {data.batchCount}
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
                          fill="url(#analyticsExpiryGradient)"
                          dot={{ r: 3, fill: "#0d9488", strokeWidth: 1 }}
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
                              const data = payload[0].payload;
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
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="units" fill="#0d9488" radius={[4, 4, 0, 0]}>
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

                {/* Monthly Numbers Breakdown Row */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">
                      Monthly Numbers ({activeTimeline.length} Months)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {activeTimeline.map((item: any) => {
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
                              ? "border-teal-200 bg-teal-50/50 hover:bg-teal-50"
                              : "border-slate-200 bg-slate-50/60 opacity-70"
                          )}
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
                <AlertTriangle className="h-8 w-8 text-slate-300" />
                <p className="text-xs text-slate-400 mt-2">No scheduled future expirations found.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
