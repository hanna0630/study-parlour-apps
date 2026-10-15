"use client";

import React, { useState } from "react";
import { AttendanceLedgerEngine, AttendanceResolution } from "@/lib/attendance/AttendanceLedgerEngine";

interface LoggedLessonRow {
  id: string;
  studentName: string;
  subject: string;
  classType: "private_1to1" | "group_fixed";
  status: "scheduled" | "completed" | "student_absent" | "tutor_cancellation";
}

export default function AttendanceLogBoard() {
  const [lessons, setLessons] = useState<LoggedLessonRow[]>([
    { id: "LES_901", studentName: "Edward Elric", subject: "Mathematics", classType: "private_1to1", status: "scheduled" },
    { id: "LES_902", studentName: "Alphonse Elric", subject: "Biology", classType: "group_fixed", status: "scheduled" }
  ]);

  const [auditLogs, setAuditLogs] = useState<string[]>([]);

  const executeStatusChange = (id: string, target: "completed" | "student_absent" | "tutor_cancellation") => {
    // Structural Guard: Warn before executing financially consequential modifications
    const targetLesson = lessons.find(l => l.id === id);
    if (!targetLesson) return;

    const confirmed = window.confirm(`Confirm attendance entry: "${target.toUpperCase()}" for ${targetLesson.studentName}? This updates the credit ledger.`);
    if (!confirmed) return;

    const resolution = AttendanceLedgerEngine.processStatusTransition(
      targetLesson.status,
      target,
      targetLesson.classType
    );

    setLessons(prev => 
      prev.map(l => l.id === id ? { ...l, status: target } : l)
    );

    // Append output metrics straight into the auditable view log trail
    const logTimestamp = new Date().toLocaleTimeString();
    const logMessage = `[${logTimestamp}] Lesson ${id} (${targetLesson.studentName}): ${resolution.auditLogReason}`;
    setAuditLogs(prev => [logMessage, ...prev]);

    if (resolution.notifyUser) {
      alert(`🔔 System Broadcast Triggered: Affected students notified of cancellation.`);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Board Branding Layout Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
          <span>📋</span> Attendance Verification Workspace
        </h3>
        <p className="text-xs text-slate-400 m-0 mt-1">
          Immutable Balance Tracking Engines • Allowed State Transitions Enforced
        </p>
      </div>

      <div className="p-6 bg-slate-50 flex flex-col gap-6">
        {/* Dynamic Table Sheet */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse m-0">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                <th className="p-4">Student</th>
                <th className="p-4">Subject</th>
                <th className="p-4">Class Structure</th>
                <th className="p-4">Current State</th>
                <th className="p-4 text-right">Verification Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{lesson.studentName}</td>
                  <td className="p-4"><span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 border rounded text-slate-600">{lesson.subject}</span></td>
                  <td className="p-4 text-xs font-medium text-slate-500 capitalize">{lesson.classType.replace("_", " ")}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${
                      lesson.status === "scheduled" ? "bg-blue-50 text-blue-600 border-blue-200" :
                      lesson.status === "completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                      lesson.status === "tutor_cancellation" ? "bg-rose-50 text-rose-600 border-rose-200" :
                      "bg-amber-50 text-amber-600 border-amber-200"
                    }`}>
                      {lesson.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    {lesson.status === "scheduled" ? (
                      <>
                        <button
                          onClick={() => executeStatusChange(lesson.id, "tutor_cancellation")}
                          className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Tutor Cancel
                        </button>
                        <button
                          onClick={() => executeStatusChange(lesson.id, "student_absent")}
                          className="bg-white hover:bg-amber-50 text-amber-600 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Absent / No-Show
                        </button>
                        <button
                          onClick={() => executeStatusChange(lesson.id, "completed")}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg border-none shadow-sm transition-colors cursor-pointer"
                        >
                          Mark Attended
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium italic px-2">🔒 Entry Finalized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Immutable Audit Trail Terminal View */}
        <div className="bg-slate-900 text-slate-300 rounded-xl p-5 border border-slate-800 shadow-inner flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Ledger Activity Audit Trail</span>
          <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto font-mono text-xs">
            {auditLogs.length === 0 ? (
              <span className="text-slate-600 italic">No ledger updates tracked in this context session.</span>
            ) : (
              auditLogs.map((log, index) => <div key={index} className="text-emerald-400 leading-relaxed">{log}</div>)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
