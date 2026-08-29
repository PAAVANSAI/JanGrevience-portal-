-- =================================================================================
-- PHASE 7: WORKFLOW / STATUS ENGINE & COMMENTS
-- Adds full status enums, strict DB-level state machine, and communication threaded notes.
-- =================================================================================

-- 1. Add all new statuses to the grievance_status ENUM
-- Note: 'SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED' were added in Phase 3.
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'ACKNOWLEDGED';
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'ADDITIONAL_INFORMATION_REQUIRED';
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'ACTION_TAKEN';
ALTER TYPE public.grievance_status ADD VALUE IF NOT EXISTS 'CLOSED';

-- 2. Create the grievance_comments table
CREATE TABLE public.grievance_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grievance_id UUID NOT NULL REFERENCES public.grievances(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_role public.user_role NOT NULL,
    comment_text TEXT NOT NULL,
    is_visible_to_citizen BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on comments
ALTER TABLE public.grievance_comments ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Comments

-- Citizens can view visible comments on their own grievances
CREATE POLICY "Citizens can view visible comments on own grievances"
    ON public.grievance_comments FOR SELECT
    USING (
        is_visible_to_citizen = true
        AND EXISTS (
            SELECT 1 FROM public.grievances 
            WHERE id = grievance_id AND citizen_id = auth.uid()
        )
    );

-- Citizens can add comments to their own grievances (e.g. replying to info requests)
CREATE POLICY "Citizens can add comments to own grievances"
    ON public.grievance_comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.grievances 
            WHERE id = grievance_id AND citizen_id = auth.uid()
        )
    );

-- Officers can view all comments on grievances in their department
CREATE POLICY "Officers can view comments in their department"
    ON public.grievance_comments FOR SELECT
    USING (
        public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievances g
            WHERE g.id = grievance_id 
            AND g.department_id = public.get_my_department_id()
        )
    );

-- Officers can add comments to grievances ASSIGNED TO THEM
CREATE POLICY "Officers can add comments to assigned grievances"
    ON public.grievance_comments FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND public.get_my_role() IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
        AND EXISTS (
            SELECT 1 FROM public.grievance_assignments ga
            WHERE ga.grievance_id = grievance_comments.grievance_id 
            AND ga.officer_id = auth.uid()
        )
    );

-- 4. DB TRIGGER: Strict State Machine Enforcement
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
        IF NEW.status NOT IN ('ACKNOWLEDGED', 'ASSIGNED', 'REJECTED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from SUBMITTED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ACKNOWLEDGED' THEN
        IF NEW.status NOT IN ('ASSIGNED', 'REJECTED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ACKNOWLEDGED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ASSIGNED' THEN
        IF NEW.status NOT IN ('IN_PROGRESS') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ASSIGNED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'IN_PROGRESS' THEN
        IF NEW.status NOT IN ('ADDITIONAL_INFORMATION_REQUIRED', 'ACTION_TAKEN', 'RESOLVED', 'REJECTED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from IN_PROGRESS to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ADDITIONAL_INFORMATION_REQUIRED' THEN
        -- Citizen provides info, moving it back
        IF NEW.status NOT IN ('IN_PROGRESS') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ADDITIONAL_INFORMATION_REQUIRED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'ACTION_TAKEN' THEN
        IF NEW.status NOT IN ('RESOLVED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from ACTION_TAKEN to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'RESOLVED' THEN
        IF NEW.status NOT IN ('CLOSED') THEN
            RAISE EXCEPTION 'Invalid transition: Cannot move from RESOLVED to %', NEW.status;
        END IF;
    ELSIF OLD.status = 'REJECTED' OR OLD.status = 'CLOSED' THEN
        -- Terminal states (until appeals are added in Phase 10)
        RAISE EXCEPTION 'Invalid transition: % is a terminal state', OLD.status;
    ELSE
        RAISE EXCEPTION 'Unknown state transition';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_status_transition_trigger ON public.grievances;
CREATE TRIGGER enforce_status_transition_trigger
    BEFORE UPDATE OF status ON public.grievances
    FOR EACH ROW EXECUTE FUNCTION public.enforce_grievance_status_machine();
