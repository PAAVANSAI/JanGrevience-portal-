-- Phase 31: Location Intelligence & Upvoting

-- 1. Add location and upvote tracking to grievances
ALTER TABLE public.grievances 
ADD COLUMN IF NOT EXISTS latitude FLOAT8,
ADD COLUMN IF NOT EXISTS longitude FLOAT8,
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0 NOT NULL;

-- 2. Create grievance_upvotes table
CREATE TABLE IF NOT EXISTS public.grievance_upvotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(grievance_id, user_id)
);

-- Enable RLS
ALTER TABLE public.grievance_upvotes ENABLE ROW LEVEL SECURITY;

-- Policies for upvotes
CREATE POLICY "Upvotes are viewable by everyone"
    ON public.grievance_upvotes FOR SELECT
    USING ( true );

CREATE POLICY "Authenticated users can upvote"
    ON public.grievance_upvotes FOR INSERT
    WITH CHECK ( auth.uid() = user_id );

-- 3. Stored Procedure for atomic upvoting
CREATE OR REPLACE FUNCTION public.upvote_grievance(p_grievance_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Insert the upvote record (will fail if unique constraint violated)
    INSERT INTO public.grievance_upvotes (grievance_id, user_id)
    VALUES (p_grievance_id, auth.uid());

    -- Increment the count on the grievance table
    UPDATE public.grievances
    SET upvote_count = upvote_count + 1
    WHERE id = p_grievance_id;
END;
$$;
