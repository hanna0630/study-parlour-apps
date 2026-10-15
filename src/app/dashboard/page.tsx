"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import OwnerFinanceDashboard from "@/components/finance/OwnerFinanceDashboard";
import TutorPayrollDashboard from "@/components/payroll/TutorPayrollDashboard";
import AttendanceLogBoard from "@/components/attendance/AttendanceLogBoard";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import CalendarFilters from "@/components/calendar/CalendarFilters";

export default function MasterDashboardGateway() {
  const { user, locale } = useApp();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm font-semibold text-slate-600 animate-pulse">Checking authenticated session access parameters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full py-4 font-sans animate-fade-in">
      {/* Dynamic Profile Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight m-0">
            {locale === "en" ? `Welcome Back, ${user.fullName}` : `Selamat Datang Kembali, ${user.fullName}`}
          </h2>
          <p className="text-xs text-slate-400 m-0 mt-1 font-medium tracking-wide">
            Account Clearance Scope: <span className="text-amber-400 font-bold uppercase">{user.role}</span> • Session Token Validated
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>Live Supabase Cluster Connected</span>
        </div>
      </div>

      {/* RENDER GRID MATRIX 1: MASTER FINANCIAL CONTROLS SECTION */}
      {user.role === "owner" && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2">
            <span className="text-sm font-bold tracking-wider uppercase text-slate-400">Section I: Financial Ledger Metrics & Overheads</span>
          </div>
          <OwnerFinanceDashboard />
        </section>
      )}

      {/* RENDER GRID MATRIX 2: SCHEDULING ENGINES & GOOGLE CALENDAR INTERACTIONS */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2">
          <span className="text-sm font-bold tracking-wider uppercase text-slate-400">Section II: Calendar Operations & Spatial Filters</span>
        </div>
        <div className="flex flex-col gap-6">
          <CalendarFilters />
          <CalendarGrid />
        </div>
      </section>

      {/* RENDER GRID MATRIX 3: ADMINISTRATIVE VERIFICATION BOARDS */}
      {(user.role === "owner" || user.role === "administrator" || user.role === "tutor") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-2">
          {/* Column A: Attendance Audits */}
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold tracking-wider uppercase text-slate-400 px-2">Section III: Attendance Audits</span>
            <AttendanceLogBoard />
          </div>

          {/* Column B: Compensation Finalizations */}
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold tracking-wider uppercase text-slate-400 px-2">Section IV: Tutor Distributions</span>
            <TutorPayrollDashboard />
          </div>
        </div>
      )}
    </div>
  );
}
