"use client";

import React from "react";
import { useApp, AppRole } from "@/context/AppContext";

interface NavItem {
  labelEn: string;
  labelId: string;
  href: string;
  icon: string;
  allowedRoles: AppRole[];
}

const navigationSchema: NavItem[] = [
  { labelEn: "Dashboard", labelId: "Dasbor", href: "/dashboard", icon: "📊", allowedRoles: ["owner", "administrator", "tutor", "parent", "student"] },
  { labelEn: "Google Calendar Sync", labelId: "Kalender", href: "/calendar", icon: "📅", allowedRoles: ["owner", "administrator", "tutor", "parent", "student"] },
  { labelEn: "Student Profiles", labelId: "Profil Siswa", href: "/students", icon: "🧑‍🎓", allowedRoles: ["owner", "administrator", "tutor"] },
  { labelEn: "Parent Accounts", labelId: "Akun Orang Tua", href: "/parents", icon: "👥", allowedRoles: ["owner", "administrator"] },
  { labelEn: "Tutor Workloads", labelId: "Beban Kerja Tutor", href: "/tutors", icon: "👨‍🏫", allowedRoles: ["owner", "administrator"] },
  { labelEn: "Invoices & Billing", labelId: "Faktur & Tagihan", href: "/invoices", icon: "🧾", allowedRoles: ["owner", "administrator", "parent", "student"] },
  { labelEn: "Tutor Payroll Sheets", labelId: "Gaji Tutor", href: "/payroll", icon: "💰", allowedRoles: ["owner", "tutor"] },
  { labelEn: "Academy Settings", labelId: "Pengaturan Akademi", href: "/settings", icon: "⚙️", allowedRoles: ["owner"] },
];

export default function SidebarNav() {
  const { user, locale, setLocale, branding, logout } = useApp();

  if (!user) return null;

  // Role Filtering logic matching permissions specs
  const filteredNav = navigationSchema.filter((item) => item.allowedRoles.includes(user.role));

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 font-sans">
      <div className="flex flex-col py-4">
        {/* Branding Configuration Area */}
        <div className="px-6 py-4 flex items-center gap-3 border-b border-slate-800 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" /> : "SP"}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white truncate max-w-[150px]">{branding.academyName}</span>
            <span className="text-xs text-amber-500 capitalize font-medium">{user.role} Portal</span>
          </div>
        </div>

        {/* Dynamic Navigation Options */}
        <nav className="flex flex-col px-3 gap-1">
          {filteredNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors no-underline"
            >
              <span className="text-base">{item.icon}</span>
              <span>{locale === "en" ? item.labelEn : item.labelId}</span>
            </a>
          ))}
        </nav>
      </div>

      {/* Global Interface Switcher Controls */}
      <div className="p-4 border-t border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs px-2">
          <span className="text-slate-500 font-medium">Language / Bahasa</span>
          <div className="flex gap-1 bg-slate-800 p-0.5 rounded-md">
            <button 
              onClick={() => setLocale("en")} 
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${locale === "en" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >EN</button>
            <button 
              onClick={() => setLocale("id")} 
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${locale === "id" ? "bg-blue-600 text-white" : "text-slate-400"}`}
            >ID</button>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-rose-400 hover:bg-rose-950 hover:text-rose-200 transition-colors cursor-pointer border-none"
        >
          🚪 Sign Out Session
        </button>
      </div>
    </aside>
  );
}
