-- Phase 27: Fix Department Transfer RLS Policy

-- 1. Drop the old restrictive UPDATE policy
DROP POLICY IF EXISTS "Dept Admins can update department grievances" ON public.grievances;

-- 2. Recreate it with a relaxed WITH CHECK clause so they can transfer it out of their department
CREATE POLICY "Dept Admins can update department grievances"
    ON public.grievances FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.department_id = grievances.department_id
            AND profiles.role = 'DEPT_ADMIN'
        )
    )
    WITH CHECK (
        -- Allow updating to any department, but the OLD row must still have been in their dept (enforced by USING)
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'DEPT_ADMIN'
        )
    );
