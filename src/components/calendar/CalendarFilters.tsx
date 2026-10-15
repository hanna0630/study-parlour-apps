"use client";

import React, { useState } from "react";

interface FilterState {
  tutorId: string;
  studentId: string;
  subject: string;
  classType: string;
}

export default function CalendarFilters() {
  const [filters, setFilters] = useState<FilterState>({
    tutorId: "all",
    studentId: "all",
    subject: "all",
    classType: "all",
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    console.log(`[CALENDAR FILTER ENGAGED] Field: ${key} | Target: ${value}`);
  };

  const clearAllFilters = () => {
    setFilters({ tutorId: "all", studentId: "all", subject: "all", classType: "all" });
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 font-sans flex flex-col gap-5">
      {/* Visual Identity Title Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
            <span>🔍</span> Google Calendar Filter Index
          </h4>
          <p className="text-xs text-slate-500 m-0 mt-0.5">
            Interpret schedules via Academy Time (WIB) or localized global offsets safely
          </p>
        </div>
        <button 
          onClick={clearAllFilters}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer transition-colors"
        >
          Reset All Filters
        </button>
      </div>

      {/* Responsive Input Selection Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Selector 1: Tutor Workloads */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter By Instructor</label>
          <select 
            value={filters.tutorId}
            onChange={(e) => handleFilterChange("tutorId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-600 font-medium text-slate-700"
          >
            <option value="all">All Tutors (Workload Grid)</option>
            <option value="TUT_01">Edward Elric</option>
            <option value="TUT_02">Roy Mustang</option>
          </select>
        </div>

        {/* Selector 2: Sibling Student Profile Tracker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter By Student</label>
          <select 
            value={filters.studentId}
            onChange={(e) => handleFilterChange("studentId", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-600 font-medium text-slate-700"
          >
            <option value="all">All Linked Students</option>
            <option value="STU_01">Alphonse Elric (Sibling A)</option>
            <option value="STU_02">Winry Rockbell (Sibling B)</option>
          </select>
        </div>

        {/* Selector 3: Academic Subjects */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter By Subject</label>
          <select 
            value={filters.subject}
            onChange={(e) => handleFilterChange("subject", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-600 font-medium text-slate-700"
          >
            <option value="all">All Courses / Subjects</option>
            <option value="math">Mathematics (Cambridge/IB)</option>
            <option value="chemistry">Organic Chemistry</option>
            <option value="biology">Standard Biology</option>
          </select>
        </div>

        {/* Selector 4: Class Type Parameters */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter By Class Type</label>
          <select 
            value={filters.classType}
            onChange={(e) => handleFilterChange("classType", e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-600 font-medium text-slate-700"
          >
            <option value="all">All Class Formats</option>
            <option value="private_1to1">Private 1-to-1 Lessons</option>
            <option value="group_fixed">Fixed Enrollment Groups</option>
            <option value="group_flexible">Flexible Class Blocks</option>
          </select>
        </div>
      </div>

      {/* Configured Time Zone Badge Output */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span>🌏</span> <span>Active System Timezone: <b className="text-slate-800">Asia/Jakarta (UTC+07:00)</b></span>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
          Daylight Saving Rule Check: Active
        </span>
      </div>
    </div>
  );
}
