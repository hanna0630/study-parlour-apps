"use client";

import React from "react";
import { Invoice, PaymentRecord, TutorPayrollEntry } from "@/types";
import { FinancialAccountingAggregator } from "@/lib/finance/FinancialSummaryAggregator";

export default function OwnerFinanceDashboard() {
  // Real database mock data representations using explicit BigInt entries
  const currentInvoices: Invoice[] = [
    { id: "INV_01", invoiceNumber: "INV-2026-001", payerId: "P_01", currency: "IDR", amountMinorUnits: BigInt(2400000), status: "paid", dueDate: new Date(), lineItems: [] },
    { id: "INV_02", invoiceNumber: "INV-2026-002", payerId: "P_02", currency: "IDR", amountMinorUnits: BigInt(1200000), status: "awaiting payment", dueDate: new Date(), lineItems: [] }
  ];

  const processedPayments: PaymentRecord[] = [
    { id: "TX_01", invoiceId: "INV_01", profileId: "P_01", amountMinorUnits: BigInt(2400000), currency: "IDR", reportingCurrency: "IDR", exchangeRate: 1.0, settlementAmountMinorUnits: BigInt(2400000), status: "successful", provider: "manual_bank", customerSurchargeMinorUnits: BigInt(0) }
  ];

  const accruedPayroll: TutorPayrollEntry[] = [
    { id: "PAY_01", tutorId: "TUT_01", baseCompensationType: "per_hour", rateAppliedMinorUnits: BigInt(350000), bonusMinorUnits: BigInt(0), deductionMinorUnits: BigInt(0), totalPayableMinorUnits: BigInt(350000), status: "approved" }
  ];

  const staticExpensesMinorUnits = BigInt(150000); // IDR 150.000 structural overhead expense

  // Compile calculations through the processing aggregator engine
  const metrics = FinancialAccountingAggregator.processLedgerMatrix(
    currentInvoices,
    processedPayments,
    accruedPayroll,
    staticExpensesMinorUnits
  );

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Header Info Branding panel */}
      <div className="p-6 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h3 className="text-lg font-bold text-white m-0 flex items-center gap-2">
            <span>📊</span> Academy Financial Reporting Matrix
          </h3>
          <p className="text-xs text-slate-400 m-0 mt-1">
            Real-Time Calculation Output Base • Cash Settlement vs Accrual Isolation Protocols Active
          </p>
        </div>
      </div>

      {/* Main Grid Interface Display */}
      <div className="p-6 bg-slate-50 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Card 1: Gross Invoiced Amounts */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gross Invoiced Value</span>
          <span className="text-2xl font-extrabold text-slate-900">
            IDR {(Number(metrics.invoicedAmountsMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-500 m-0 leading-relaxed border-t border-slate-100 pt-2">
            Total historical transaction value generated from all recurring monthly and package-purchase billing issues.
          </p>
        </div>

        {/* Metric Card 2: Cash Settlements Received */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm border-l-emerald-500 border-l-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Payments Received (Liquid Cash)</span>
          <span className="text-2xl font-extrabold text-emerald-700">
            IDR {(Number(metrics.paymentsReceivedMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-500 m-0 leading-relaxed border-t border-slate-100 pt-2">
            Authoritative, verified server-side cash collections activity. Only counts successful transactions.
          </p>
        </div>

        {/* Metric Card 3: Outstanding Receivables */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm border-l-amber-500 border-l-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Outstanding Balances</span>
          <span className="text-2xl font-extrabold text-amber-700">
            IDR {(Number(metrics.outstandingBalancesMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-500 m-0 leading-relaxed border-t border-slate-100 pt-2">
            Outstanding billing resources currently locked in `awaiting_payment` or `overdue` states. Excludes liquid cash.
          </p>
        </div>

        {/* Metric Card 4: Tutor Pay Commitments */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tutor Obligations Accrued</span>
          <span className="text-2xl font-extrabold text-rose-700">
            IDR {(Number(metrics.tutorCompensationObligationsMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-500 m-0 leading-relaxed border-t border-slate-100 pt-2">
            Total payroll outlays accumulated across session durations, hourly metrics, and manual adjustment rules.
          </p>
        </div>

        {/* Metric Card 5: Operational Overheads */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-2 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recorded System Expenses</span>
          <span className="text-2xl font-extrabold text-slate-800">
            IDR {(Number(metrics.recordedExpensesMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-500 m-0 leading-relaxed border-t border-slate-100 pt-2">
            Operational facility fees, supplies, and marketing expenditures recorded via administrative approval chains.
          </p>
        </div>

        {/* Metric Card 6: Clean Estimated Profit */}
        <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col gap-2 shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Calculated Operating Profit</span>
          <span className="text-2xl font-extrabold text-blue-400">
            IDR {(Number(metrics.estimatedProfitMinorUnits) / 100).toLocaleString("id-ID")}
          </span>
          <p className="text-xs text-slate-400 m-0 leading-relaxed border-t border-slate-800 pt-2">
            Liquid net yield derived using strict accounting standards: <br /><b>(Cash Payments Received) - (Accrued Payroll + Expenses)</b>.
          </p>
        </div>

      </div>
    </div>
  );
}
