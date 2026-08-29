-- Phase 26: Dept Admin Assignment Permissions

-- 1. Policy: Dept Admins can insert assignments for their department
CREATE POLICY "Dept Admins can assign officers in their dept"
    ON public.grievance_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = grievance_assignments.grievance_id 
            AND p.id = auth.uid()
            AND p.role = 'DEPT_ADMIN'
        )
    );

-- 2. Policy: Dept Admins can delete assignments in their department
CREATE POLICY "Dept Admins can remove assignments in their dept"
    ON public.grievance_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.grievances g
            JOIN public.profiles p ON p.department_id = g.department_id
            WHERE g.id = grievance_assignments.grievance_id 
            AND p.id = auth.uid()
            AND p.role = 'DEPT_ADMIN'
        )
    );
