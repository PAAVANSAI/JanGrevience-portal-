-- Phase 28: Allow citizens to update their own grievances (e.g. for resolution disputes)

CREATE POLICY "Citizens can update their own grievances"
    ON public.grievances FOR UPDATE
    USING (
        auth.uid() = citizen_id
    )
    WITH CHECK (
        auth.uid() = citizen_id
    );
