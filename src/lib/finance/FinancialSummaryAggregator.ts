import { Invoice, PaymentRecord, TutorPayrollEntry, OwnerFinancialSummary } from "@/types";

export class FinancialAccountingAggregator {
  /**
   * Compiles distinct business reporting channels using exact integer minor representations.
   * Aligns with strict reporting definitions to isolate cash from obligations.
   */
  public static processLedgerMatrix(
    invoices: Invoice[],
    payments: PaymentRecord[],
    payroll: TutorPayrollEntry[],
    expensesMinorUnits: bigint
  ): OwnerFinancialSummary {
    
    // 1. Invoiced Amounts: Absolute immutable gross value generated
    const invoicedAmountsMinorUnits = invoices.reduce((sum, inv) => sum + inv.amountMinorUnits, BigInt(0));

    // 2. Payments Received: Actual cash settlement collections activity only
    const paymentsReceivedMinorUnits = payments
      .filter((p) => p.status === "successful")
      .reduce((sum, p) => sum + p.settlementAmountMinorUnits, BigInt(0));

    // 3. Outstanding Balances: Invoiced value that remains unpaid (Using exact database enum terms)
    const outstandingBalancesMinorUnits = invoices
      .filter((inv) => inv.status === "awaiting payment" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.amountMinorUnits, BigInt(0));

    // 4. Tutor Compensation Obligations: Gross accrued earnings pending or authorized
    const tutorCompensationObligationsMinorUnits = payroll
      .filter((pay) => pay.status !== "cancelled")
      .reduce((sum, pay) => sum + pay.totalPayableMinorUnits, BigInt(0));

    // 5. Estimated Net Profit: Real Cash Received minus (Accrued Tutor Pay Obligations + Expenses)
    const totalOutflows = tutorCompensationObligationsMinorUnits + expensesMinorUnits;
    const estimatedProfitMinorUnits = paymentsReceivedMinorUnits - totalOutflows;

    return {
      invoicedAmountsMinorUnits,
      paymentsReceivedMinorUnits,
      outstandingBalancesMinorUnits,
      tutorCompensationObligationsMinorUnits,
      recordedExpensesMinorUnits: expensesMinorUnits,
      estimatedProfitMinorUnits,
    };
  }
}
