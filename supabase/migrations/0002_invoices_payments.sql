-- ============================================================================
-- 1. TRANSACTIONAL LIFECYCLE STATES (New Enums)
-- ============================================================================
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending_approval', 'issued', 'awaiting_payment', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_refunded');
CREATE TYPE public.payment_status AS ENUM ('initiated', 'pending', 'successful', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded');
CREATE TYPE public.proof_status AS ENUM ('pending', 'approved', 'rejected', 'more_information_requested', 'escalated');
CREATE TYPE public.payroll_status AS ENUM ('earned', 'pending_approval', 'approved', 'paid', 'cancelled');
CREATE TYPE public.expense_status AS ENUM ('pending', 'approved', 'paid', 'rejected');

-- ============================================================================
-- 2. UPDATE EXISTING PROFILES TABLE (Using Agreed app_role Enums)
-- ============================================================================
-- Altering the existing table columns to perfectly match the original system architecture rules:
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'student'::public.app_role NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS billing_currency VARCHAR(3) DEFAULT 'IDR' NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL;

-- ============================================================================
-- 3. INVOICING & LINE-ITEM ACCOUNTING (Decimal-Safe Minor Units)
-- ============================================================================

-- INVOICES 
CREATE TABLE public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
    amount_minor_units BIGINT DEFAULT 0 NOT NULL CHECK (amount_minor_units >= 0),
    status public.invoice_status DEFAULT 'draft'::public.invoice_status NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- INVOICE LINE ITEMS (Tracks sibling & student associations explicitly)
CREATE TABLE public.invoice_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    enrollment_id UUID NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_amount_minor_units BIGINT NOT NULL CHECK (unit_amount_minor_units >= 0),
    total_amount_minor_units BIGINT NOT NULL CHECK (total_amount_minor_units >= 0)
);

-- ============================================================================
-- 4. INDEPENDENT TRANSACTION ADAPTER LAYER
-- ============================================================================

-- PAYMENTS
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    amount_minor_units BIGINT NOT NULL CHECK (amount_minor_units > 0),
    currency VARCHAR(3) NOT NULL,
    reporting_currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC(12, 6) DEFAULT 1.000000 NOT NULL,
    exchange_rate_source TEXT,
    settlement_amount_minor_units BIGINT NOT NULL CHECK (settlement_amount_minor_units > 0),
    status public.payment_status DEFAULT 'initiated'::public.payment_status NOT NULL,
    provider TEXT NOT NULL,
    provider_transaction_id TEXT UNIQUE,
    provider_fee_minor_units BIGINT DEFAULT 0 NOT NULL CHECK (provider_fee_minor_units >= 0),
    customer_surcharge_minor_units BIGINT DEFAULT 0 NOT NULL CHECK (customer_surcharge_minor_units >= 0),
    webhook_signature TEXT,
    idempotency_key TEXT UNIQUE
);

-- SECURE MANUAL VERIFICATION PROOFS
CREATE TABLE public.manual_payment_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL UNIQUE,
    file_storage_path TEXT NOT NULL,
    submitted_amount_minor_units BIGINT NOT NULL,
    submitted_currency VARCHAR(3) NOT NULL,
    reference_number TEXT,
    status public.proof_status DEFAULT 'pending'::public.proof_status NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_or_review_reason TEXT,
    audit_history JSONB[] DEFAULT ARRAY[]::jsonb[] NOT NULL
);

-- REFUNDS, REVERSALS, & FINANCIAL CORRECTIONS
CREATE TABLE public.financial_corrections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    original_payment_id UUID REFERENCES public.payments(id) ON DELETE RESTRICT NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE RESTRICT NOT NULL,
    requested_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    amount_minor_units BIGINT NOT NULL CHECK (amount_minor_units > 0),
    reason TEXT NOT NULL,
    provider_refund_id TEXT,
    is_external_confirmed BOOLEAN DEFAULT FALSE NOT NULL
);

-- ============================================================================
-- 5. AUDITABLE PAYROLL & EXPENSES
-- ============================================================================

-- PAYROLL
CREATE TABLE public.tutor_payroll_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    lesson_id UUID,
    base_compensation_type TEXT NOT NULL CHECK (base_compensation_type IN ('per_session', 'per_hour', 'adjustment')),
    rate_applied_minor_units BIGINT NOT NULL CHECK (rate_applied_minor_units >= 0),
    duration_minutes INTEGER DEFAULT 60 NOT NULL,
    bonus_minor_units BIGINT DEFAULT 0 NOT NULL CHECK (bonus_minor_units >= 0),
    deduction_minor_units BIGINT DEFAULT 0 NOT NULL CHECK (deduction_minor_units >= 0),
    adjustment_reason TEXT,
    total_payable_minor_units BIGINT NOT NULL CHECK (total_payable_minor_units >= 0),
    currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
    status public.payroll_status DEFAULT 'earned'::public.payroll_status NOT NULL,
    payroll_period_start DATE NOT NULL,
    payroll_period_end DATE NOT NULL,
    finalized_by UUID REFERENCES public.profiles(id),
    finalized_at TIMESTAMP WITH TIME ZONE
);

-- EXPENSES
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount_minor_units BIGINT NOT NULL CHECK (amount_minor_units > 0),
    currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
    exchange_rate NUMERIC(12, 6) DEFAULT 1.000000 NOT NULL,
    reporting_amount_minor_units BIGINT NOT NULL,
    receipt_attachment_url TEXT,
    status public.expense_status DEFAULT 'pending'::public.expense_status NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    approved_by UUID REFERENCES public.profiles(id)
);

-- ============================================================================
-- 6. SPEED OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX idx_invoices_payer ON public.invoices(payer_id);
CREATE INDEX idx_line_items_invoice ON public.invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_student ON public.invoice_line_items(student_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payroll_tutor ON public.tutor_payroll_ledger(tutor_id);
CREATE INDEX idx_payroll_period ON public.tutor_payroll_ledger(payroll_period_start, payroll_period_end);

-- ============================================================================
-- 7. SECURITY MATRIX (Strict Role-Based Isolation Rules)
-- ============================================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_payroll_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 7.1 PROFILES POLICIES
CREATE POLICY "Allow users to view own profile or children profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR auth.uid() = parent_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));

-- 7.2 INVOICES POLICIES
CREATE POLICY "Payer families view own invoices" ON public.invoices
FOR SELECT USING (auth.uid() = payer_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));
-- 7.3 INVOICE LINE ITEMS POLICIES
CREATE POLICY "Payer families view own line items" ON public.invoice_line_items
FOR SELECT USING (EXISTS (SELECT 1 FROM public.invoices WHERE id = invoice_line_items.invoice_id AND (payer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)))));
-- 7.4 PAYMENTS POLICIES
CREATE POLICY "Payer families view own payments" ON public.payments
FOR SELECT USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));
-- 7.5 MANUAL PROOFS
CREATE POLICY "Secure isolation view for parent proofs" ON public.manual_payment_proofs
FOR SELECT USING (EXISTS (SELECT 1 FROM public.payments WHERE id = manual_payment_proofs.payment_id AND profile_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));
-- 7.6 TUTOR COMPENSATION
CREATE POLICY "Tutors view own ledger sheets only" ON public.tutor_payroll_ledger
FOR SELECT USING (tutor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));