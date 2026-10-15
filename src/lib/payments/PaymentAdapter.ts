import { Invoice, PaymentRecord, PaymentStatus } from "@/types";

export interface PaymentProviderAdapter {
  providerName: string;
  initiatePayment(invoice: Invoice, amount: bigint, currency: string): Promise<PaymentRecord>;
  verifyWebhookSignature(signature: string, rawBody: string): boolean;
}

export class PaymentCoreEngine {
  /**
   * Evaluates the Full-Payment Condition constraint specified by requirements.
   * Activation occurs ONLY when total successful transactions meet the required invoice total.
   */
  public static verifyFullPaymentRule(invoice: Invoice, history: PaymentRecord[]): { isActivated: boolean; outstandingMinorUnits: bigint } {
    const totalPaidMinorUnits = history
      .filter((tx) => tx.status === "successful")
      .reduce((sum, tx) => sum + tx.settlementAmountMinorUnits, BigInt(0));

    const invoiceTotal = invoice.amountMinorUnits;
    const outstandingMinorUnits = invoiceTotal - totalPaidMinorUnits;

    // Strict Rule Check: Never treat partial payment as package activation
    if (outstandingMinorUnits <= BigInt(0)) {
      return { isActivated: true, outstandingMinorUnits: BigInt(0) };
    }

    return { isActivated: false, outstandingMinorUnits };
  }
}
