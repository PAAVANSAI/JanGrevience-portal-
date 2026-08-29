-- Phase 18: Super Admin Control Center
-- 1. Add is_active to profiles
ALTER TABLE public.profiles
ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. Create system_settings table
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System settings are viewable by everyone"
    ON public.system_settings FOR SELECT
    USING (true);

CREATE POLICY "System settings are insertable by SUPER_ADMIN"
    ON public.system_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "System settings are updatable by SUPER_ADMIN"
    ON public.system_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "System settings are deletable by SUPER_ADMIN"
    ON public.system_settings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- 2.5 Add policy for Super Admins to view all profiles globally
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    );
$$;

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_super_admin());

-- Insert initial settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('default_sla_days', '7'::jsonb, 'Default SLA target days for new categories'),
    ('allow_public_tracking', 'true'::jsonb, 'Allow citizens to track grievances without logging in');

-- 3. Enforce REAL UPDATE/INSERT/DELETE RLS on taxonomy (departments, categories, sla_rules)
-- departments
CREATE POLICY "Departments are insertable by SUPER_ADMIN" ON public.departments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Departments are updatable by SUPER_ADMIN" ON public.departments FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Departments are deletable by SUPER_ADMIN" ON public.departments FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- categories
CREATE POLICY "Categories are insertable by SUPER_ADMIN" ON public.categories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Categories are updatable by SUPER_ADMIN" ON public.categories FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Categories are deletable by SUPER_ADMIN" ON public.categories FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- 4. Secure RPC for Role Change
CREATE OR REPLACE FUNCTION public.admin_change_user_role(
    p_user_id UUID,
    p_new_role public.user_role
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_role public.user_role;
BEGIN
    -- Check caller is SUPER_ADMIN
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
    IF v_admin_role != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Only SUPER_ADMIN can change user roles';
    END IF;

    -- Update role
    UPDATE public.profiles
    SET role = p_new_role,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;

-- 5. Secure RPC for User Deactivation
CREATE OR REPLACE FUNCTION public.admin_toggle_user_active(
    p_user_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_role public.user_role;
BEGIN
    -- Check caller is SUPER_ADMIN
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = auth.uid();
    IF v_admin_role != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Unauthorized: Only SUPER_ADMIN can deactivate users';
    END IF;

    -- Update active status
    UPDATE public.profiles
    SET is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;

-- 6. Secure RPC for Department Assignment (for Dept Admin or Super Admin)
CREATE OR REPLACE FUNCTION public.admin_assign_user_department(
    p_user_id UUID,
    p_department_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    v_admin_role public.user_role;
    v_admin_dept UUID;
    v_target_role public.user_role;
BEGIN
    -- Get caller info
    SELECT role, department_id INTO v_admin_role, v_admin_dept FROM public.profiles WHERE id = auth.uid();
    
    -- Check authorization
    IF v_admin_role = 'SUPER_ADMIN' THEN
        -- Allow
    ELSIF v_admin_role = 'DEPT_ADMIN' THEN
        -- Dept Admin can only assign to their own department
        IF p_department_id != v_admin_dept THEN
            RAISE EXCEPTION 'Unauthorized: Dept Admin can only assign to their own department';
        END IF;
    ELSE
        RAISE EXCEPTION 'Unauthorized: Must be SUPER_ADMIN or DEPT_ADMIN';
    END IF;

    -- Target must be an Officer or Dept Admin
    SELECT role INTO v_target_role FROM public.profiles WHERE id = p_user_id;
    IF v_target_role NOT IN ('OFFICER', 'DEPT_ADMIN') THEN
         RAISE EXCEPTION 'Invalid target: Can only assign departments to OFFICERS or DEPT_ADMINS';
    END IF;

    -- Update department
    UPDATE public.profiles
    SET department_id = p_department_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN TRUE;
END;
$$;
