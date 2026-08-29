-- Fix for Phase 9 Migration
-- Run this in your Supabase SQL Editor if the previous script failed.

-- 1. Add CLOSED to enum (this MUST be outside of any transaction or DO block)
-- If this line throws an error because "CLOSED" already exists, you can just ignore that specific error and continue!
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'CLOSED';

-- 2. Create Enums & Types
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appeal_status') THEN
        CREATE TYPE public.appeal_status AS ENUM ('APPEAL_SUBMITTED', 'UNDER_REVIEW', 'DECISION_MADE', 'CLOSED');
    END IF;
END
$$;

-- 3. Feedback Table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE UNIQUE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens can insert their own feedback" ON public.feedback;
CREATE POLICY "Citizens can insert their own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = citizen_id AND EXISTS (SELECT 1 FROM public.grievances g WHERE g.id = grievance_id AND g.status = 'RESOLVED'));

DROP POLICY IF EXISTS "Citizens can view their own feedback" ON public.feedback;
CREATE POLICY "Citizens can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Officers can view feedback in their department" ON public.feedback;
CREATE POLICY "Officers can view feedback in their department"
    ON public.feedback FOR SELECT
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            WHERE g.id = feedback.grievance_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

-- 4. Sequence for Appeal ID
CREATE SEQUENCE IF NOT EXISTS public.appeal_seq START 1;

-- 5. Appeals Table
CREATE TABLE IF NOT EXISTS public.appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_number TEXT UNIQUE,
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE UNIQUE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status public.appeal_status NOT NULL DEFAULT 'APPEAL_SUBMITTED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;

-- Trigger to Generate Appeal ID
CREATE OR REPLACE FUNCTION public.set_appeal_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.appeal_number := 'APL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('public.appeal_seq')::TEXT, 6, '0');
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appeal_insert ON public.appeals;
CREATE TRIGGER on_appeal_insert
    BEFORE INSERT ON public.appeals
    FOR EACH ROW EXECUTE FUNCTION public.set_appeal_number();

-- Appeal Policies
DROP POLICY IF EXISTS "Citizens can insert appeals for their own grievances" ON public.appeals;
CREATE POLICY "Citizens can insert appeals for their own grievances"
    ON public.appeals FOR INSERT
    WITH CHECK (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Citizens can view their own appeals" ON public.appeals;
CREATE POLICY "Citizens can view their own appeals"
    ON public.appeals FOR SELECT
    USING (auth.uid() = citizen_id);

DROP POLICY IF EXISTS "Officers can view appeals in their department" ON public.appeals;
CREATE POLICY "Officers can view appeals in their department"
    ON public.appeals FOR SELECT
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            WHERE g.id = appeals.grievance_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

DROP POLICY IF EXISTS "Officers can update appeals in their department" ON public.appeals;
CREATE POLICY "Officers can update appeals in their department"
    ON public.appeals FOR UPDATE
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            WHERE g.id = appeals.grievance_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

-- 6. Appeal Status History Table
CREATE TABLE IF NOT EXISTS public.appeal_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appeal_id UUID NOT NULL REFERENCES public.appeals(id) ON DELETE CASCADE,
    status public.appeal_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appeal_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Citizens can view their own appeal history" ON public.appeal_status_history;
CREATE POLICY "Citizens can view their own appeal history"
    ON public.appeal_status_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.appeals a
            WHERE a.id = appeal_id AND a.citizen_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers can view appeal history in their department" ON public.appeal_status_history;
CREATE POLICY "Officers can view appeal history in their department"
    ON public.appeal_status_history FOR SELECT
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.appeals a
            JOIN public.grievances g ON g.id = a.grievance_id
            WHERE a.id = appeal_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

-- Trigger to log appeal status changes
CREATE OR REPLACE FUNCTION public.log_appeal_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.appeal_status_history (appeal_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_appeal_status_change ON public.appeals;
CREATE TRIGGER on_appeal_status_change
    AFTER INSERT OR UPDATE OF status ON public.appeals
    FOR EACH ROW EXECUTE FUNCTION public.log_appeal_status_change();


-- 7. Add appeal_id to grievance_attachments
ALTER TABLE public.grievance_attachments 
ADD COLUMN IF NOT EXISTS appeal_id UUID REFERENCES public.appeals(id) ON DELETE CASCADE;

-- 8. Add to realtime (ignore if they are already in realtime)
DO $$
BEGIN
    -- It might throw an error if already in publication, safe to wrap or just ignore errors on UI.
    -- ALTER PUBLICATION supabase_realtime ADD TABLE public.appeals;
    -- ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
END
$$;
