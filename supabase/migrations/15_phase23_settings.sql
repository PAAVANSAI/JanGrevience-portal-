-- Phase 23: Citizen Settings & Account Security

-- 1. Create login_activity table
CREATE TABLE IF NOT EXISTS public.login_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logged_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    device_info TEXT
);

-- Enable RLS on login_activity
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own login activity
CREATE POLICY "Users can view their own login activity"
    ON public.login_activity FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own login activity (client-side tracking)
CREATE POLICY "Users can insert their own login activity"
    ON public.login_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 2. Add is_deleted to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;

-- 3. Create deactivate_account RPC
-- This function allows a citizen to soft-delete their account and anonymize their data
CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as superuser to bypass RLS if needed
AS $$
DECLARE
    current_uid UUID;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Update the profile to anonymize personal data and set is_deleted
    UPDATE public.profiles
    SET 
        is_deleted = true,
        full_name = 'Deleted User',
        phone = NULL,
        address_line = NULL,
        sub_locality = NULL,
        gender = NULL,
        landline_phone = NULL
    WHERE id = current_uid;

    -- Audit log for account deletion (using Phase 15 audit logs if available)
    INSERT INTO public.audit_logs (
        action_type, 
        entity_type, 
        entity_id, 
        actor_id, 
        actor_role,
        old_data,
        new_data,
        description
    )
    SELECT 
        'PROFILE_DELETED', 
        'profile', 
        current_uid, 
        current_uid, 
        role,
        '{}'::jsonb,
        '{"is_deleted": true}'::jsonb,
        'User requested account deletion and data anonymization'
    FROM public.profiles
    WHERE id = current_uid;
    
END;
$$;
