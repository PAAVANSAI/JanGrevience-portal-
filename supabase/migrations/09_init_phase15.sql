-- Phase 15: Audit Logs & Security Hardening
-- Creates the immutable audit_logs table

CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. STRICT IMMUTABILITY:
-- Explicitly REVOKE UPDATE and DELETE from authenticated and anon roles
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated, anon, public;

-- Even for service_role, we can leave it default but application roles (authenticated/anon) have NO UPDATE/DELETE.
-- In Postgres, if no policy exists for UPDATE/DELETE, it is denied by default when RLS is enabled.

-- 2. READ ACCESS (Super Admin Only)
CREATE POLICY "Audit logs are viewable by super admin only"
    ON public.audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- 3. INSERT ACCESS (Any authenticated user can insert logs)
-- Note: Realistically, officers and admins perform most audited actions.
CREATE POLICY "Audit logs are insertable by authenticated users"
    ON public.audit_logs FOR INSERT
    WITH CHECK ( auth.uid() = user_id );
