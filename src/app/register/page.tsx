"use client";

import React, { useState } from "react";

// Explicit Enrollment Workflow States according to architecture specification rules
type EnrollmentState = 
  | "draft"
  | "submitted"
  | "awaiting_guardian_verification"
  | "awaiting_academy_review"
  | "awaiting_payment"
  | "active";

export default function PublicRegistrationWizard() {
  const [step, setStep] = useState<EnrollmentState>("draft");
  const [isMinor, setIsMinor] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    subject: "Mathematics",
    guardianName: "",
    guardianEmail: "",
    packageSelection: "Standard 8-Lesson Package",
  });

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    setFormData({ ...formData, dateOfBirth: dob });

    // Enforce minor check logic instantly
    const birthYear = new Date(dob).getFullYear();
    const currentYear = new Date().getFullYear();
    if (currentYear - birthYear < 18) {
      setIsMinor(true);
    } else {
      setIsMinor(false);
    }
  };

  const executeFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Server Validation fallback state route assignment
    if (isMinor) {
      setStep("awaiting_guardian_verification");
    } else {
      setStep("awaiting_academy_review");
    }
  };

  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-xl p-8 font-sans">
      {/* State Indicator Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Student Enrollment</h2>
          <p className="text-xs text-slate-500 m-0">Secure public self-registration processing engine</p>
        </div>
        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          State: {step.replace(/_/g, " ")}
        </span>
      </div>

      {step === "draft" ? (
        <form onSubmit={executeFormSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Full Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g., Jane Doe"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Date of Birth</label>
            <input 
              type="date" 
              required
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
              value={formData.dateOfBirth}
              onChange={handleDobChange}
            />
          </div>

          {/* Minor Identity Safe Guard Condition Entry */}
          {isMinor && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-4">
              <span className="text-xs font-bold text-blue-800">🛡️ Guardian Verification Profile Requirement Active</span>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Guardian Name</label>
                  <input 
                    type="text" 
                    required={isMinor}
                    placeholder="Parent full name"
                    className="px-3 py-1.5 border border-blue-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-600"
                    value={formData.guardianName}
                    onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Guardian Email</label>
                  <input 
                    type="email" 
                    required={isMinor}
                    placeholder="parent@email.com"
                    className="px-3 py-1.5 border border-blue-200 bg-white rounded-lg text-xs focus:outline-none focus:border-blue-600"
                    value={formData.guardianEmail}
                    onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Published Learning Package</label>
            <select 
              className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:border-blue-600"
              value={formData.packageSelection}
              onChange={(e) => setFormData({ ...formData, packageSelection: e.target.value })}
            >
              <option>Standard 8-Lesson Package (IDR 2.400.000)</option>
              <option>Intensive 16-Lesson Package (IDR 4.500.000)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 rounded-xl shadow transition-colors mt-2 cursor-pointer border-none"
          >
            Submit Application Profile
          </button>
        </form>
      ) : (
        /* Workflow Resulting Screen Layouts */
        <div className="flex flex-col items-center py-6 text-center gap-4">
          <div className="text-4xl">📥</div>
          <h3 className="text-lg font-bold text-slate-900 m-0">Application Records Stored Successfully</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-sm m-0">
            {step === "awaiting_guardian_verification" 
              ? `An authentication link has been dispatched to ${formData.guardianEmail}. Parental verification is required before class placement processing can begin.` 
              : "Your request is currently awaiting academy review. Pricing confirmations and package structures will become viewable once approved by administrators."}
          </p>
          <button 
            onClick={() => setStep("draft")}
            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-transparent border-none cursor-pointer"
          >
            ← Register Another Profile account
          </button>
        </div>
      )}
    </div>
  );
}
