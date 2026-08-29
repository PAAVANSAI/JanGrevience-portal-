-- Fix for infinite recursion when updating grievances

-- 1. Create a helper function that bypasses RLS to check assignment
CREATE OR REPLACE FUNCTION public.check_is_assigned_to_grievance(g_id UUID, o_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.grievance_assignments 
        WHERE grievance_id = g_id 
        AND officer_id = o_id
    );
$$;

-- 2. Drop the recursive UPDATE policy on grievances
DROP POLICY IF EXISTS "Officers can update assigned grievances" ON public.grievances;

-- 3. Create a safe UPDATE policy using the helper function
CREATE POLICY "Officers can update assigned grievances"
    ON public.grievances FOR UPDATE
    USING (
        public.check_is_assigned_to_grievance(id, auth.uid())
    );
