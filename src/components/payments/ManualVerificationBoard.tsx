"use client";

import React, { useState } from "react";
import { ManualPaymentProof } from "@/types";

export default function ManualVerificationBoard() {
  // Demo array matching parent-uploaded payment proof parameters
  const [proofs, setProofs] = useState<ManualPaymentProof[]>([
    {
      id: "PROOF_99",
      paymentId: "TX_404",
      fileStoragePath: "/secure-vault/receipts/proof_404.jpg",
      submittedAmountMinorUnits: BigInt(2400000), // IDR 2.400.000 in integer minor units
      submittedCurrency: "IDR",
      status: "pending",
    },
  ]);

  const [reviewReason, setReviewReason] = useState("");

  const updateProofStatus = (id: string, newStatus: 'approved' | 'rejected' | 'escalated') => {
    // Structural Guard: Destructive/financially consequential alert verification requirement
    const confirmation = window.confirm(`Confirm administrative state shift to: ${newStatus.toUpperCase()}?`);
    if (!confirmation) return;

    setProofs((prev) =>
      prev.map((proof) =>
        proof.id === id 
          ? { ...proof, status: newStatus, rejectionOrReviewReason: reviewReason || undefined } 
          : proof
      )
    );
    setReviewReason("");
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Board Branding Layout Header */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <span>🛡️</span> Manual Ledger Verification Interface
          </h3>
          <p className="text-xs text-slate-400 m-0 mt-1">
            Parent Upload Audits • Protected Cloud Storage Access Protocol Active
          </p>
        </div>
      </div>

      <div className="p-6 bg-slate-50 flex flex-col gap-6">
        {proofs.map((proof) => (
          <div key={proof.id} className="border border-slate-200 rounded-xl p-6 bg-white flex flex-col gap-4 shadow-sm">
            {/* Meta Information Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">ID: {proof.id}</span>
                <span className="text-xs text-slate-500 font-medium">Link Token: {proof.paymentId}</span>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                proof.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" :
                proof.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                Workflow Status: {proof.status}
              </span>
            </div>

            {/* Verification Metric Values Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Auditable Ledger Amount</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {proof.submittedCurrency} {(Number(proof.submittedAmountMinorUnits) / 100).toLocaleString("id-ID")}
                </span>
                <span className="text-xs text-slate-500 font-medium">Verified decimal-safe integer base format</span>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure Document Link</span>
                <a 
                  href="#" 
                  onClick={(e) => { e.preventDefault(); alert("Accessing secure cloud storage path: " + proof.fileStoragePath); }}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1.5"
                >
                  📄 View Encrypted Parent Payment Proof.jpg
                </a>
              </div>
            </div>

            {/* Interactive Internal Review Field Section */}
            {proof.status === "pending" && (
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600">Administrative Review Log Note / Reason</label>
                  <input
                    type="text"
                    placeholder="Enter approval details, rejection reasons, or escalation details..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-600 transition-colors"
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                  />
                </div>

                {/* Form Action Controls */}
                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                  <button
                    onClick={() => updateProofStatus(proof.id, "rejected")}
                    className="bg-white hover:bg-rose-50 border border-slate-200 text-rose-600 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    ❌ Reject Proof
                  </button>
                  <button
                    onClick={() => updateProofStatus(proof.id, "escalated")}
                    className="bg-white hover:bg-amber-50 border border-slate-200 text-amber-600 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    ⚠️ Escalate to Owner
                  </button>
                  <button
                    onClick={() => updateProofStatus(proof.id, "approved")}
                    className="bg-slate-900 hover:bg-slate-800 border-none text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer"
                  >
                    ✅ Authorize and Approve
                  </button>
                </div>
              </div>
            )}

            {proof.rejectionOrReviewReason && (
              <div className="bg-slate-100 rounded-lg p-3 border border-slate-200 text-xs text-slate-700 font-medium">
                📄 <b className="text-slate-900">Audit Trail Log Note:</b> {proof.rejectionOrReviewReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
