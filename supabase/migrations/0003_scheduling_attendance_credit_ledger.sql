-- ============================================================================
-- 1. STRUCTURAL ENUMS & STATE MACHINES (Safe Creation)
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE public.enrollment_status AS ENUM ('draft', 'submitted', 'awaiting_guardian_verification', 'awaiting_academy_review', 'awaiting_payment', 'active', 'suspended', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'class_type') THEN
        CREATE TYPE public.class_type AS ENUM ('private_1to1', 'group_fixed', 'group_flexible');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lesson_status') THEN
        CREATE TYPE public.lesson_status AS ENUM ('scheduled', 'completed', 'student_attended', 'student_absent', 'chargeable_no_show', 'student_cancellation', 'tutor_cancellation', 'rescheduled', 'cancelled_without_charge');
    END IF;
END $$;

-- ============================================================================
-- 2. ACADEMIC ENROLLMENTS & SUB-PROFILES (Safe Updates)
-- ============================================================================

-- STUDENT PROFILE METRICS
CREATE TABLE IF NOT EXISTS public.student_extensions (
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    date_of_birth DATE NOT NULL,
    emergency_contact JSONB NOT NULL,
    school_name TEXT,
    grade_level TEXT,
    curriculum TEXT,
    learning_goals TEXT,
    academic_progress_summary TEXT,
    sensitive_learning_needs TEXT,
    restricted_internal_notes TEXT
);

-- PACKAGES CATALOGUE 
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    class_type public.class_type NOT NULL,
    subject TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    lesson_entitlements INT NOT NULL CHECK (lesson_entitlements > 0),
    price_minor_units BIGINT NOT NULL CHECK (price_minor_units >= 0),
    currency VARCHAR(3) DEFAULT 'IDR' NOT NULL,
    validity_days INT
);

-- ENROLLMENTS WORKFLOW LEDGER
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    package_id UUID REFERENCES public.packages(id) ON DELETE RESTRICT NOT NULL,
    status public.enrollment_status DEFAULT 'draft'::public.enrollment_status NOT NULL,
    locked_price_minor_units BIGINT NOT NULL,
    locked_currency VARCHAR(3) NOT NULL,
    lesson_entitlements_total INT NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- MULTI-SUBJECT ENROLLMENT LINK TABLE
CREATE TABLE IF NOT EXISTS public.enrollment_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    UNIQUE(enrollment_id, subject)
);

-- ============================================================================
-- 3. GOOGLE CALENDAR INTERACTIONS & WAITLIST MODULES
-- ============================================================================

-- LESSON SCHEDULES
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE RESTRICT NOT NULL,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    subject TEXT NOT NULL,
    class_type public.class_type NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    academy_timezone TEXT DEFAULT 'Asia/Jakarta' NOT NULL,
    online_meeting_url TEXT,
    location_designation TEXT DEFAULT 'online' NOT NULL,
    status public.lesson_status DEFAULT 'scheduled'::public.lesson_status NOT NULL,
    capacity_limit INT DEFAULT 1 NOT NULL CHECK (capacity_limit > 0),
    parent_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
);

-- MULTI-STUDENT GROUP ROSTER BINDINGS
CREATE TABLE IF NOT EXISTS public.lesson_rosters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    attendance_status public.lesson_status DEFAULT 'scheduled'::public.lesson_status NOT NULL,
    UNIQUE(lesson_id, student_id)
);

-- CONCURRENT TIMEOUT WAITLIST MANAGEMENT
CREATE TABLE IF NOT EXISTS public.lesson_waitlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    queue_position INT NOT NULL,
    is_notified BOOLEAN DEFAULT FALSE NOT NULL,
    UNIQUE(lesson_id, student_id)
);

-- ============================================================================
-- 4. CRITICAL CORE BUSINESS NODE: APPEND-ONLY CREDIT LEDGER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.credit_ledger (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE RESTRICT NOT NULL,
    subject TEXT NOT NULL,
    class_type public.class_type NOT NULL,
    transaction_kind public.credit_kind NOT NULL,
    delta INT NOT NULL CHECK (delta <> 0),
    related_lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    related_payment_id UUID,
    expiration_marker TIMESTAMP WITH TIME ZONE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT NOT NULL,
    reason TEXT NOT NULL,
    idempotency_hash TEXT UNIQUE NOT NULL
);

-- ============================================================================
-- 5. RELATIONAL CONFLICT PREVENTION TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_tutor_schedule_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM public.lessons
      WHERE tutor_id = NEW.tutor_id
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND status NOT IN ('tutor_cancellation', 'cancelled_without_charge', 'rescheduled')
        AND tsrange(start_time, end_time) && tsrange(NEW.start_time, NEW.end_time)
  ) THEN
      RAISE EXCEPTION 'Scheduling Conflict Error: Selected tutor is already booked in an overlapping window.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FIXED LINE HERE: Added the missing CREATE keyword
CREATE OR REPLACE TRIGGER trigger_prevent_tutor_overlap
    BEFORE INSERT OR UPDATE ON public.lessons
    FOR EACH ROW EXECUTE FUNCTION public.check_tutor_schedule_conflict();

-- ============================================================================
-- 6. SECURITY ENGINE: ISOLATION MATRIX (RLS)
-- ============================================================================
ALTER TABLE public.student_extensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stricter access isolation rule for internal notes" ON public.student_extensions;
DROP POLICY IF EXISTS "Standard profile parameters visible to verified parents" ON public.student_extensions;
DROP POLICY IF EXISTS "Students and parents view own credit records" ON public.credit_ledger;
DROP POLICY IF EXISTS "Lessons visibility index filters" ON public.lessons;

CREATE POLICY "Stricter access isolation rule for internal notes" ON public.student_extensions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)));

CREATE POLICY "Standard profile parameters visible to verified parents" ON public.student_extensions
    FOR SELECT USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (parent_id = auth.uid() OR role = 'tutor'::public.app_role)));

CREATE POLICY "Students and parents view own credit records" ON public.credit_ledger
    FOR SELECT USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (parent_id = auth.uid() OR role IN ('administrator'::public.app_role, 'owner'::public.app_role))));

CREATE POLICY "Lessons visibility index filters" ON public.lessons
    FOR SELECT USING (tutor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('administrator'::public.app_role, 'owner'::public.app_role)) OR EXISTS (SELECT 1 FROM public.lesson_rosters WHERE lesson_id = public.lessons.id AND student_id = auth.uid()));
