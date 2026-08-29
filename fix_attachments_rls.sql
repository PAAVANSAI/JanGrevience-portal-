-- Fix RLS for Officers to view attachments

-- 1. Allow officers to SELECT from the grievance_attachments Postgres table
CREATE POLICY "Officers can view attachments in their department"
    ON public.grievance_attachments FOR SELECT
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            WHERE g.id = grievance_attachments.grievance_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

-- 2. Allow officers to view/download files from the storage bucket
CREATE POLICY "Officers can view storage attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'grievance_attachments' 
        AND auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        )
    );
