import { TutorPayrollEntry } from "@/types";

export interface PayrollPeriodSummary {
  earnedMinorUnits: bigint;
  bonusMinorUnits: bigint;
  deductionMinorUnits: bigint;
  netPayableMinorUnits: bigint;
}

export class PayrollAccountingEngine {
  /**
   * Evaluates the net compensation total for a given ledger period using decimal-safe minor units.
   * Ensures that corrections use a logged adjustment value rather than silently overwriting historical data.
   */
  public static calculateNetPayable(entry: Omit<TutorPayrollEntry, "totalPayableMinorUnits">): bigint {
    const netPayable = entry.rateAppliedMinorUnits + entry.bonusMinorUnits - entry.deductionMinorUnits;
    
    if (netPayable < BigInt(0)) {
      throw new Error("Payroll Engine Conflict: Total payable allocation cannot yield a negative metric state.");
    }
    
    return netPayable;
  }

  /**
   * Compiles total aggregate obligations across a series of verified entries for owner review.
   */
  public static aggregatePeriodSummary(entries: TutorPayrollEntry[]): PayrollPeriodSummary {
    return entries.reduce(
      (acc, entry) => {
        acc.earnedMinorUnits += entry.rateAppliedMinorUnits;
        acc.bonusMinorUnits += entry.bonusMinorUnits;
        acc.deductionMinorUnits += entry.deductionMinorUnits;
        acc.netPayableMinorUnits += entry.totalPayableMinorUnits;
        return acc;
      },
      {
        earnedMinorUnits: BigInt(0),
        bonusMinorUnits: BigInt(0),
        deductionMinorUnits: BigInt(0),
        netPayableMinorUnits: BigInt(0),
      }
    );
  }
}
