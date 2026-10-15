// ============================================================================
// 1. INVOICING & LIFECYCLE TRACKING
// ============================================================================
// Aligned perfectly with your live Supabase enum migration parameters
export type InvoiceStatus = 'draft' | 'pending approval' | 'issued' | 'awaiting payment' | 'paid' | 'overdue' | 'cancelled' | 'refunded' | 'partially refunded';
// Aligned perfectly with your live Supabase migration public.lesson_status custom enum parameters
export type LessonStatus = 
  | 'scheduled' 
  | 'completed' 
  | 'student_attended' 
  | 'student_absent' 
  | 'chargeable_no_show' 
  | 'student_cancellation' 
  | 'tutor_cancellation' 
  | 'rescheduled' 
  | 'cancelled_without_charge';


export interface InvoiceLineItem {
  id: string;
  studentId: string;
  enrollmentId: string;
  description: string;
  quantity: number;
  unitAmountMinorUnits: bigint; // Decimal-safe integer minor representation
  totalAmountMinorUnits: bigint;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  payerId: string;
  currency: string;
  amountMinorUnits: bigint;
  status: InvoiceStatus;
  dueDate: Date;
  lineItems: InvoiceLineItem[];
}

// ============================================================================
// 2. MULTI-PROVIDER PAYMENT INTEGRATION INTERFACE
// ============================================================================
export type PaymentStatus = 'initiated' | 'pending' | 'successful' | 'failed' | 'cancelled' | 'expired' | 'refunded';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  profileId: string;
  amountMinorUnits: bigint;
  currency: string;
  reportingCurrency: string; // Default: 'IDR'
  exchangeRate: number;
  settlementAmountMinorUnits: bigint;
  status: PaymentStatus;
  provider: 'midtrans' | 'xendit' | 'paypal' | 'manual_bank';
  providerTransactionId?: string;
  customerSurchargeMinorUnits: bigint;
}

export interface ManualPaymentProof {
  id: string;
  paymentId: string;
  fileStoragePath: string;
  submittedAmountMinorUnits: bigint;
  submittedCurrency: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  rejectionOrReviewReason?: string;
}

// ============================================================================
// 3. TUTOR COMPENSATION & FINANCIAL REPORTING SUMMARY
// ============================================================================
export interface TutorPayrollEntry {
  id: string;
  tutorId: string;
  lessonId?: string;
  baseCompensationType: 'per_session' | 'per_hour' | 'adjustment';
  rateAppliedMinorUnits: bigint;
  bonusMinorUnits: bigint;
  deductionMinorUnits: bigint;
  totalPayableMinorUnits: bigint;
  // FIXED LINE HERE: Added 'cancelled' to the structural union string array type
  status: 'earned' | 'pending_approval' | 'approved' | 'paid' | 'cancelled';
}


export interface OwnerFinancialSummary {
  invoicedAmountsMinorUnits: bigint;
  paymentsReceivedMinorUnits: bigint;
  outstandingBalancesMinorUnits: bigint;
  tutorCompensationObligationsMinorUnits: bigint;
  recordedExpensesMinorUnits: bigint;
  estimatedProfitMinorUnits: bigint;
}
