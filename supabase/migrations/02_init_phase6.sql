-- =================================================================================
-- PHASE 6: OFFICER DASHBOARD & ASSIGNMENTS
-- Adds department mapping for officers, assignment tracking, and officer RLS rules.
-- =================================================================================

-- 1. Add department_id to profiles so officers can be linked to a specific department
ALTER TABLE public.profiles 
ADD COLUMN department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL;

-- 2. Create the grievance_assignments table
CREATE TABLE public.grievance_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    officer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Null implies self-assigned
    
    -- An officer can only be assigned to a specific grievance once at a time
    UNIQUE(grievance_id, officer_id)
);

-- Enable RLS on assignments
ALTER TABLE public.grievance_assignments ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- RLS POLICIES FOR OFFICERS
-- =================================================================================

-- PROFILES: Officers can see all profiles in their own department (e.g., to see colleagues)
CREATE POLICY "Officers can view profiles in their department"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        )
        AND department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    );

-- GRIEVANCES (SELECT): Officers can read grievances assigned to their department
CREATE POLICY "Officers can read department grievances"
    ON public.grievances FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        )
        AND department_id = (SELECT department_id FROM public.profiles WHERE id = auth.uid())
    );

-- GRIEVANCES (UPDATE): Officers can ONLY update grievances assigned to THEM
CREATE POLICY "Officers can update assigned grievances"
    ON public.grievances FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.grievance_assignments 
            WHERE grievance_assignments.grievance_id = grievances.id 
            AND grievance_assignments.officer_id = auth.uid()
        )
    );

-- ASSIGNMENTS (SELECT): Officers can see assignments in their department
CREATE POLICY "Officers can view department assignments"
    ON public.grievance_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = grievance_assignments.grievance_id 
            AND p.id = auth.uid()
        )
    );

-- ASSIGNMENTS (INSERT): Officers can assign themselves to grievances in their department
CREATE POLICY "Officers can assign themselves to department grievances"
    ON public.grievance_assignments FOR INSERT
    WITH CHECK (
        officer_id = auth.uid() 
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = grievance_id 
            AND p.id = auth.uid()
        )
    );

-- =================================================================================
-- UPDATE TRIGGER FOR TIMELINE
-- If not created already via chat, ensure the trigger exists to log status changes
-- =================================================================================
CREATE OR REPLACE FUNCTION public.log_grievance_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.grievance_status_history (grievance_id, status)
        VALUES (NEW.id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_grievance_status_updated ON public.grievances;
CREATE TRIGGER on_grievance_status_updated
    AFTER UPDATE OF status ON public.grievances
    FOR EACH ROW EXECUTE FUNCTION public.log_grievance_status_change();
