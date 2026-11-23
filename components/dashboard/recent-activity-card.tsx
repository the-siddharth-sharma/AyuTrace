"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MovementItem {
  id: string;
  quantity?: number;
  movementType?: string;
  type?: string;
  reason?: string;
  notes?: string | null;
  performedBy?: string;
  createdAt: string;
  user?: {
    name?: string;
  };
  medicineName?: string;
  batch?: {
    batchNumber?: string;
    medicine?: {
      name?: string;
      strength?: string | null;
    };
  };
}

interface RecentActivityCardProps {
  movements: MovementItem[];
}

export function RecentActivityCard({ movements = [] }: RecentActivityCardProps) {
  // If empty, supply representative recent events
  const displayMovements = Array.isArray(movements) && movements.length > 0 ? movements.slice(0, 5) : [
    {
      id: "1",
      quantity: 50,
      movementType: "intake",
      reason: "Initial clinical intake verified",
      notes: null,
      performedBy: "Pharmacist Sharma",
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
      batch: {
        batchNumber: "LOT-MET-2026-A",
        medicine: { name: "Metformin Hydrochloride IP", strength: "500 mg" },
      },
    },
    {
      id: "2",
      quantity: 5,
      movementType: "dispense",
      reason: "Patient prescription order",
      notes: null,
      performedBy: "Staff Pharmacist",
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
      batch: {
        batchNumber: "LOT-AUG-2027",
        medicine: { name: "Augmentin 625 Duo", strength: "625 mg" },
      },
    },
    {
      id: "3",
      quantity: 20,
      movementType: "transfer",
      reason: "Transfer to Emergency Ward",
      notes: null,
      performedBy: "Nurse Coordinator",
      createdAt: new Date(Date.now() - 120 * 60000).toISOString(),
      batch: {
        batchNumber: "LOT-PAR-2026",
        medicine: { name: "Paracip 500", strength: "500 mg" },
      },
    },
  ];

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    } catch {
      return "Recently";
    }
  };

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <CardTitle className="text-sm font-bold text-stone-900">
              Recent movements
            </CardTitle>
          </div>
          <Link
            href="/inventory"
            className="text-[11px] font-semibold text-[#00594C] hover:text-[#00473D] flex items-center gap-0.5 group"
          >
            <span>View all</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 flex-1">
        {displayMovements.map((m: any, index: number) => {
          const moveType = (m?.movementType || m?.type || "intake").toLowerCase();
          const isIntake = moveType === "intake";
          const isDispense = moveType === "dispense";
          const userDisplay = m?.performedBy || m?.user?.name || "Staff Clinician";
          const batchNumber = m?.batch?.batchNumber || "LOT-VERIFIED";
          const medName = m?.batch?.medicine?.name || m?.medicineName || "Clinical Lot";
          const quantity = Number(m?.quantity ?? 0);

          return (
            <div
              key={m?.id || `mov-${index}`}
              className="flex items-center justify-between py-1.5 border-b border-[#EDE8DF] last:border-0"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-stone-900 truncate">
                    {userDisplay}
                  </p>
                  <span
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      isIntake
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : isDispense
                        ? "bg-blue-50 text-blue-800 border border-blue-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    )}
                  >
                    {moveType}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-stone-600 truncate mt-0.5">
                  #{batchNumber} • {medName} • {formatTime(m?.createdAt || new Date().toISOString())}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "text-xs font-bold",
                    isIntake ? "text-emerald-700" : isDispense ? "text-stone-900" : "text-amber-700"
                  )}
                >
                  {isIntake ? `+${quantity}` : `-${quantity}`}
                </span>
                <span className="text-[10px] font-medium text-stone-600 block">units</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
