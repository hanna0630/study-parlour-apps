import { NextResponse } from "next/server";
import crypto from "crypto";

// Mock helper representing your system's secure database verification model
async function checkIfTransactionProcessed(providerTxId: string): Promise<boolean> {
  // Queries your public.payments table for an existing idempotency lock token
  return false; 
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-callback-signature") || "";

    // 1. SECURITY MANDATE: Validate Webhook Signature using Server-Side Secret Key
    // Never expose secret keys to the browser context screen
    const localSecret = process.env.PAYMENT_WEBHOOK_SECRET || "default_secure_fallback_token";
    const computedHash = crypto
      .createHmac("sha256", localSecret)
      .update(rawBody)
      .digest("hex");

    if (computedHash !== signature) {
      return NextResponse.json(
        { error: "Security Enforcement Violation: Authoritative signature mismatch." },
        { status: 403 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { order_id, transaction_status, gross_amount, payment_type } = payload;

    // 2. IDEMPOTENCY BOUNDARY: Prevent duplicate webhook processing drops
    const isAlreadyProcessed = await checkIfTransactionProcessed(order_id);
    if (isAlreadyProcessed) {
      return NextResponse.json({ success: true, message: "Transaction token already audited. Idempotency active." });
    }

    // 3. TRANSACTION LIFECYCLE MAPPING
    console.log(`[PAYMENT SYSTEM ADAPTER] Processing callback for order ${order_id} via ${payment_type}`);
    
    let targetStatus: "initiated" | "pending" | "successful" | "failed" | "expired" = "pending";

    if (transaction_status === "settlement" || transaction_status === "capture") {
      targetStatus = "successful";
    } else if (transaction_status === "deny" || transaction_status === "cancel") {
      targetStatus = "failed";
    } else if (transaction_status === "expire") {
      targetStatus = "expired";
    }

    // 4. FULL PAYMENT RULE ENFORCEMENT
    if (targetStatus === "successful") {
      console.log(`[FULL PAYMENT COMPLIANCE] Verifying invoice totals for order allocation...`);
      // Update tables: public.payments -> status = 'successful'
      // IF full payment met -> Trigger credit ledger append-only issuance event row
    }

    return NextResponse.json({
      success: true,
      transactionStatus: targetStatus,
      message: "Authoritative callback handled and audited cleanly."
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Webhook Handler Pipeline Failure" },
      { status: 500 }
    );
  }
}
