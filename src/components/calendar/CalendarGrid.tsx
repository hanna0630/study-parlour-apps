"use client";

import React, { useState } from "react";

interface ScheduleLessonModel {
  id: string;
  title: string;
  subject: string;
  tutorName: string;
  timeLabel: string;
  hasConflict: boolean;
  onlineLink?: string;
}

export default function CalendarGrid() {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  // High fidelity presentation model array matching real database criteria
  const demoSchedules: ScheduleLessonModel[] = [
    { id: "L_01", title: "Advanced Cambridge Mathematics", subject: "Math", tutorName: "Edward Elric", timeLabel: "09:00 - 10:30 WIB", hasConflict: false, onlineLink: "https://google.com" },
    { id: "L_02", title: "Private 1-to-1 Organic Chemistry", subject: "Chemistry", tutorName: "Roy Mustang", timeLabel: "11:00 - 12:00 WIB", hasConflict: true },
    { id: "L_03", title: "IB Standard Biology Group Block", subject: "Biology", tutorName: "Riza Hawkeye", timeLabel: "14:00 - 15:30 WIB", hasConflict: false, onlineLink: "https://google.com" }
  ];

  const filteredLessons = activeFilter === "all" 
    ? demoSchedules 
    : demoSchedules.filter(lesson => lesson.subject.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Interactive Controls Header Bar */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <span>📅</span> Schedule Coordination Panel
          </h3>
          <p className="text-xs text-slate-400 m-0 mt-1">Timezone Target: Asia/Jakarta (WIB) • DST Compliant Tracking Active</p>
        </div>
        
        {/* Dynamic Navigation Filter Widgets */}
        <div className="flex gap-2">
          {["all", "Math", "Chemistry", "Biology"].map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveFilter(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${activeFilter === sub ? "bg-blue-600 text-white shadow-sm" : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"}`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Elements Space */}
      <div className="p-6 bg-slate-50 flex flex-col gap-4">
        {filteredLessons.map((lesson) => (
          <div 
            key={lesson.id} 
            className={`border rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all bg-white relative ${lesson.hasConflict ? "border-rose-200 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`}
          >
            {/* Left Content Context Block */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">{lesson.subject}</span>
                <span className="text-sm text-slate-500 font-medium">{lesson.timeLabel}</span>
              </div>
              <h4 className="text-base font-bold text-slate-900 m-0">{lesson.title}</h4>
              <span className="text-xs text-slate-600 font-medium">Assigned Instructor: <b className="text-slate-800">{lesson.tutorName}</b></span>
            </div>

            {/* Operational Verification Actions Trigger Layout */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {lesson.hasConflict && (
                <div className="text-xs text-rose-600 bg-rose-100 border border-rose-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 animate-pulse">
                  ⚠️ Schedule Conflict Detected
                </div>
              )}
              {lesson.onlineLink ? (
                <a
                  href={lesson.onlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg no-underline shadow-sm transition-colors"
                >
                  🎥 Launch Online Room
                </a>
              ) : (
                <span className="text-xs text-slate-400 bg-slate-100 px-3 py-2 rounded-lg font-medium border border-slate-200">
                  📍 In-Person Branch Delivery
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
