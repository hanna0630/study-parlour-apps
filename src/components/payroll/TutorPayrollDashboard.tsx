"use client";

import React, { useState } from "react";
import { TutorPayrollEntry } from "@/types";
import { PayrollAccountingEngine } from "@/lib/payroll/PayrollCalculators";

export default function TutorPayrollDashboard() {
  // Demo array matching auditable tutor compensation ledger columns
  const [ledgerEntries, setLedgerEntries] = useState<TutorPayrollEntry[]>([
    {
      id: "PAY_001",
      tutorId: "TUT_RO Mustang",
      lessonId: "LES_101",
      baseCompensationType: "per_hour",
      rateAppliedMinorUnits: BigInt(300000), // IDR 300.000 baseline
      bonusMinorUnits: BigInt(50000),         // IDR 50.000 performance bonus
      deductionMinorUnits: BigInt(0),
      totalPayableMinorUnits: BigInt(350000), // IDR 350.000 total net
      status: "pending_approval",
    },
    {
      id: "PAY_002",
      tutorId: "TUT_RO Mustang",
      lessonId: "LES_102",
      baseCompensationType: "per_session",
      rateAppliedMinorUnits: BigInt(250000),
      bonusMinorUnits: BigInt(0),
      deductionMinorUnits: BigInt(20000),    // Explicit logged adjustment deduction
      totalPayableMinorUnits: BigInt(230000),
      status: "approved",
    }
  ]);

  const summary = PayrollAccountingEngine.aggregatePeriodSummary(ledgerEntries);

  const executeOwnerApproval = (id: string) => {
    // Structural Guard: Requires owner confirmation before finalization state transitions
    const isConfirmed = window.confirm("Authorize absolute owner approval to lock this finalized payroll row record?");
    if (!isConfirmed) return;

    setLedgerEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "approved" } : entry
      )
    );
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Visual Configuration Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <span>💰</span> Compensation & Payroll Ledger
          </h3>
          <p className="text-xs text-slate-400 m-0 mt-1">
            Auditable Tutor Distributions • Explicit Compensation Calculation Framework Active
          </p>
        </div>
      </div>

      {/* Aggregate Financial Performance Metrics Widgets Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 bg-slate-50/50">
        <div className="p-4 border-r border-slate-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Earned Base Total</span>
          <span className="text-base font-extrabold text-slate-900">
            IDR {(Number(summary.earnedMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
        </div>
        <div className="p-4 border-r border-slate-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Adjustments (Bonus)</span>
          <span className="text-base font-extrabold text-emerald-600">
            +IDR {(Number(summary.bonusMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
        </div>
        <div className="p-4 border-r border-slate-200 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deductions</span>
          <span className="text-base font-extrabold text-rose-600">
            -IDR {(Number(summary.deductionMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
        </div>
        <div className="p-4 flex flex-col gap-1 bg-blue-50/30">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Net Period Obligation</span>
          <span className="text-base font-extrabold text-blue-600">
            IDR {(Number(summary.netPayableMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Auditable Data Table Shell */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse m-0">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
              <th className="p-4">Entry Token</th>
              <th className="p-4">Compensation Target</th>
              <th className="p-4">Base Type</th>
              <th className="p-4 text-right">Net Allocation</th>
              <th className="p-4 text-center">Workflow State</th>
              <th className="p-4 text-center">Owner Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {ledgerEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-mono text-xs text-slate-500">{entry.id}</td>
                <td className="p-4 font-semibold text-slate-900">{entry.tutorId}</td>
                <td className="p-4"><span className="text-xs px-2 py-0.5 bg-slate-100 border rounded text-slate-600 font-medium">{entry.baseCompensationType}</span></td>
                <td className="p-4 text-right font-bold text-slate-900">IDR {(Number(entry.totalPayableMinorUnits) / 100).toLocaleString("id-ID")}</td>
                <td className="p-4 text-center">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${
                    entry.status === "pending_approval" ? "bg-amber-50 text-amber-600 border-amber-200" :
                    entry.status === "approved" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                    "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>
                    {entry.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="p-4 text-center">
                  {entry.status === "pending_approval" ? (
                    <button
                      onClick={() => executeOwnerApproval(entry.id)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg border-none shadow-sm cursor-pointer transition-colors"
                    >
                      🛡️ Authorize Release
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium italic">🔒 Locked History Record</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
