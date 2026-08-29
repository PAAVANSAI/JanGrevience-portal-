-- Function to allow a citizen to auto-close their grievance
-- when they submit positive feedback.
CREATE OR REPLACE FUNCTION public.citizen_close_grievance(p_grievance_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Verify the grievance belongs to the caller and is in RESOLVED state
    IF EXISTS (
        SELECT 1 FROM public.grievances 
        WHERE id = p_grievance_id 
        AND citizen_id = auth.uid() 
        AND status = 'RESOLVED'
    ) THEN
        UPDATE public.grievances 
        SET status = 'CLOSED', updated_at = NOW()
        WHERE id = p_grievance_id;
    ELSE
        RAISE EXCEPTION 'Not authorized or invalid grievance status';
    END IF;
END;
$$;
