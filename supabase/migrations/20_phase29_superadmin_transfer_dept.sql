-- Phase 29: Superadmin Transfer Officers

-- RPC to securely change a user's department
CREATE OR REPLACE FUNCTION public.admin_change_user_department(
    p_user_id UUID,
    p_new_department_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role public.user_role;
BEGIN
    -- Check caller role
    SELECT role INTO v_caller_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_caller_role != 'SUPER_ADMIN' THEN
        RAISE EXCEPTION 'Only Super Admins can transfer officers to different departments.';
    END IF;

    -- Update the department
    UPDATE public.profiles
    SET department_id = p_new_department_id,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Optionally, we could clear any active assignments in the old department if they had any, 
    -- but for simplicity we'll just transfer the department. (In a real system, reassigning their active grievances would be needed).
END;
$$;
