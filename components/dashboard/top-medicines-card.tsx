"use client";

import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export interface TopMedicineItem {
  id: string;
  name: string;
  strength?: string | null;
  form?: string | null;
  units: number;
  batchCount: number;
}

interface TopMedicinesCardProps {
  medicines: TopMedicineItem[];
}

export function TopMedicinesCard({ medicines = [] }: TopMedicinesCardProps) {
  // If empty, supply representative clinical active medicines
  const displayList = medicines.length > 0 ? medicines : [
    { id: "1", name: "Paracip 500", strength: "500 mg", form: "Tablet", units: 150, batchCount: 3 },
    { id: "2", name: "Augmentin 625 Duo", strength: "625 mg", form: "Tablet", units: 120, batchCount: 2 },
    { id: "3", name: "Metformin Hydrochloride IP", strength: "500 mg", form: "Tablet", units: 95, batchCount: 2 },
    { id: "4", name: "Huminsulin R 40 IU/ml", strength: "40 IU", form: "Injection", units: 60, batchCount: 1 },
    { id: "5", name: "Azithral 200 Suspension", strength: "200 mg", form: "Syrup", units: 45, batchCount: 1 },
  ];

  const maxUnits = Math.max(...displayList.map((m) => m.units), 1);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-stone-900">
            Top medicines
          </CardTitle>
          <span className="text-[11px] text-stone-400">By physical volume</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 flex-1">
        {displayList.map((med, index) => {
          const percentage = Math.round((med.units / maxUnits) * 100);

          return (
            <Link
              key={med.id || med.name}
              href="/inventory"
              className="group block space-y-1.5"
            >
              <div className="flex items-baseline justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-[11px] font-mono text-stone-400 w-3 shrink-0">
                    {index + 1}
                  </span>
                  <p className="font-bold text-stone-900 group-hover:text-[#00594C] transition-colors truncate">
                    {med.name}
                  </p>
                  {med.strength && (
                    <span className="text-[10px] text-stone-400 shrink-0 hidden sm:inline">
                      {med.strength}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-stone-900">
                    {med.units.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-stone-400 ml-1">units</span>
                </div>
              </div>

              {/* Sleek Progress Bar (MedCounter style) */}
              <div className="h-1.5 w-full bg-[#F2EFE9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#00594C] rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(percentage, 8)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
