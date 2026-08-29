-- Phase 25: Department Admin Power Features

-- 1. Add Leave Management to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_on_leave BOOLEAN DEFAULT false;

-- 2. Create Internal Notes Table
CREATE TABLE public.internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Dept Admins can read notes in their department
CREATE POLICY "Dept Admins can read internal notes in their dept"
    ON public.internal_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = internal_notes.grievance_id
            AND p.id = auth.uid()
            AND p.role = 'DEPT_ADMIN'
        )
    );

-- Policy: Officers can read notes if assigned to the grievance
CREATE POLICY "Officers can read internal notes if assigned"
    ON public.internal_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievance_assignments ga
            WHERE ga.grievance_id = internal_notes.grievance_id
            AND ga.officer_id = auth.uid()
        )
    );

-- Policy: Super Admins can read all internal notes
CREATE POLICY "Super Admins can read all internal notes"
    ON public.internal_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Policy: Dept Admins can insert notes in their department
CREATE POLICY "Dept Admins can insert internal notes in their dept"
    ON public.internal_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = internal_notes.grievance_id
            AND p.id = auth.uid()
            AND p.role = 'DEPT_ADMIN'
        )
    );

-- Policy: Officers can insert notes if assigned
CREATE POLICY "Officers can insert internal notes if assigned"
    ON public.internal_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grievance_assignments ga
            WHERE ga.grievance_id = internal_notes.grievance_id
            AND ga.officer_id = auth.uid()
        )
    );
