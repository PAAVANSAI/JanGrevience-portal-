-- Phase 24: Resolution Loop & Auto-Assignment

-- 1. Add REOPENED and ESCALATED to grievance_status ENUM
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'REOPENED';
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'ESCALATED';

-- 2. Update grievances table
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_confirmed BOOLEAN DEFAULT NULL;
ALTER TABLE public.grievances ADD COLUMN IF NOT EXISTS resolution_dispute_count INTEGER DEFAULT 0 NOT NULL;

-- 3. Update grievance_attachments table
ALTER TABLE public.grievance_attachments ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'citizen_upload' NOT NULL;

-- 4. Auto-Assignment Function
CREATE OR REPLACE FUNCTION public.auto_assign_grievance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_assigned_officer_id UUID;
BEGIN
    -- Only run on insert, and only if no assignment exists yet (which should be true on insert)
    
    -- Find the officer in the department with the fewest current active assignments
    SELECT p.id INTO v_assigned_officer_id
    FROM public.profiles p
    LEFT JOIN public.grievance_assignments ga ON ga.officer_id = p.id
    LEFT JOIN public.grievances g ON g.id = ga.grievance_id AND g.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
    WHERE p.department_id = NEW.department_id
      AND p.role = 'OFFICER'
      AND p.is_active = true
    GROUP BY p.id
    ORDER BY COUNT(g.id) ASC, p.created_at ASC
    LIMIT 1;

    -- If an officer was found, insert into assignments and add a timeline comment
    IF v_assigned_officer_id IS NOT NULL THEN
        -- Add assignment
        INSERT INTO public.grievance_assignments (grievance_id, officer_id, assigned_by)
        VALUES (NEW.id, v_assigned_officer_id, NEW.citizen_id);
        
        -- Note: The system will automatically log this if we have a trigger, but 
        -- we don't have an auto-comment trigger for assignments in Phase 6. We just rely on assignments table.
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to auto-assign on grievance creation
DROP TRIGGER IF EXISTS trigger_auto_assign_grievance ON public.grievances;
CREATE TRIGGER trigger_auto_assign_grievance
    AFTER INSERT ON public.grievances
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_grievance();

-- 5. DB TRIGGER: Strict State Machine Enforcement (Update)
CREATE OR REPLACE FUNCTION public.enforce_grievance_status_machine()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- If status hasn't changed, do nothing
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Define Valid Transitions
    IF OLD.status = 'SUBMITTED' THEN
        IF NEW.status NOT IN ('ACKNOWLEDGED', 'ASSIGNED', 'REJECTED', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from SUBMITTED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ACKNOWLEDGED' THEN
        IF NEW.status NOT IN ('ASSIGNED', 'REJECTED', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ACKNOWLEDGED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ASSIGNED' THEN
        IF NEW.status NOT IN ('IN_PROGRESS', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ASSIGNED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'IN_PROGRESS' THEN
        IF NEW.status NOT IN ('ADDITIONAL_INFORMATION_REQUIRED', 'ACTION_TAKEN', 'RESOLVED', 'REJECTED', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from IN_PROGRESS to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ADDITIONAL_INFORMATION_REQUIRED' THEN
        IF NEW.status NOT IN ('IN_PROGRESS', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ADDITIONAL_INFORMATION_REQUIRED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ACTION_TAKEN' THEN
        IF NEW.status NOT IN ('RESOLVED', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ACTION_TAKEN to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'RESOLVED' THEN
        IF NEW.status NOT IN ('CLOSED', 'REOPENED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from RESOLVED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'REOPENED' THEN
        IF NEW.status NOT IN ('IN_PROGRESS', 'ACTION_TAKEN', 'RESOLVED', 'ESCALATED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from REOPENED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ESCALATED' THEN
        IF NEW.status NOT IN ('IN_PROGRESS', 'ACTION_TAKEN', 'RESOLVED', 'REJECTED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ESCALATED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'REJECTED' OR OLD.status = 'CLOSED' THEN
        -- Terminal states (can be appealed, but handled separately)
        RAISE EXCEPTION 'Invalid transition: % is a terminal state', OLD.status;
    ELSE
        RAISE EXCEPTION 'Unknown state transition';
    END IF;

    RETURN NEW;
END;
$$;
