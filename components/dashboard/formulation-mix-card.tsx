"use client";

import React, { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface CategoryItem {
  category?: string;
  form?: string;
  units: number;
}

interface FormulationMixCardProps {
  categories?: CategoryItem[];
  totalBatches?: number;
  totalUnits?: number;
}

const COLORS = ["#00594C", "#2DD4BF", "#F59E0B", "#94A3B8", "#6366F1"];

export function FormulationMixCard({
  categories = [],
  totalBatches = 12,
  totalUnits = 753,
}: FormulationMixCardProps) {
  const data = useMemo(() => {
    if (categories.length > 0) {
      const sum = categories.reduce((acc, c) => acc + c.units, 0);
      return categories.slice(0, 4).map((c, i) => {
        const name = c.category || c.form || "General";
        const pct = sum > 0 ? Math.round((c.units / sum) * 100) : 0;
        return {
          name,
          value: c.units,
          percentage: pct,
          color: COLORS[i % COLORS.length],
        };
      });
    }

    // Default clinical formulation mix
    return [
      { name: "Tablets", value: 480, percentage: 64, color: "#00594C" },
      { name: "Syrups", value: 135, percentage: 18, color: "#2DD4BF" },
      { name: "Injections", value: 90, percentage: 12, color: "#F59E0B" },
      { name: "Capsules", value: 48, percentage: 6, color: "#94A3B8" },
    ];
  }, [categories]);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg font-extrabold text-stone-900">
          Formulation mix
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-2 flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3.5">
          {/* Donut Chart with Center Total (MedCounter style) */}
          <div className="relative h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text in Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg sm:text-xl font-extrabold text-stone-900 leading-none">
                {totalBatches}
              </span>
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider mt-0.5">
                LOTS
              </span>
            </div>
          </div>

          {/* Legend on Right (MedCounter style) */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm sm:text-[15px] font-bold text-stone-900 truncate">
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-right shrink-0">
                  <span className="text-sm sm:text-base font-extrabold text-stone-900">
                    {item.value}
                  </span>
                  <span className="text-xs sm:text-[13px] font-bold text-stone-600 w-8 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom micro-stat */}
        <div className="mt-4 pt-3 border-t border-[#EDE8DF] flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-700">Total units in stock</span>
          <span className="text-base font-extrabold text-stone-900">{totalUnits.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
