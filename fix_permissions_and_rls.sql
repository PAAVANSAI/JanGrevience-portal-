-- Ensure the roles have standard permissions
GRANT ALL ON public.feedback TO anon, authenticated, service_role;
GRANT ALL ON public.appeals TO anon, authenticated, service_role;
GRANT ALL ON public.appeal_status_history TO anon, authenticated, service_role;
GRANT USAGE ON SEQUENCE public.appeal_seq TO anon, authenticated, service_role;

-- Clean up ALL existing policies on feedback
DROP POLICY IF EXISTS "Citizens can insert their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Citizens can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Officers can view feedback in their department" ON public.feedback;

-- Recreate them as permissively as possible for the citizen
CREATE POLICY "Citizens can insert their own feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Citizens can view their own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = citizen_id);

-- If the above fails, it means there's a serious schema mismatch.
