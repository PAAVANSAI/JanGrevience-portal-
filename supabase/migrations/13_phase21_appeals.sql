-- Phase 21: Appeals Management Module
-- Add fields to track officer decisions on appeals

-- 1. Add new columns to appeals table
ALTER TABLE public.appeals 
ADD COLUMN IF NOT EXISTS decision_outcome TEXT CHECK (decision_outcome IN ('UPHELD', 'OVERTURNED')),
ADD COLUMN IF NOT EXISTS decision_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- 2. Server-side validation for appeal status transitions
CREATE OR REPLACE FUNCTION public.enforce_appeal_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    -- Allow insert of new appeal
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'APPEAL_SUBMITTED' THEN
            RAISE EXCEPTION 'New appeals must start in APPEAL_SUBMITTED status';
        END IF;
        RETURN NEW;
    END IF;

    -- Only check if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Define Valid Transitions
    CASE OLD.status
        WHEN 'APPEAL_SUBMITTED' THEN
            IF NEW.status NOT IN ('UNDER_REVIEW', 'CLOSED') THEN
                RAISE EXCEPTION 'Invalid transition: Cannot move from APPEAL_SUBMITTED to %', NEW.status;
            END IF;
        WHEN 'UNDER_REVIEW' THEN
            IF NEW.status NOT IN ('DECISION_MADE', 'CLOSED') THEN
                RAISE EXCEPTION 'Invalid transition: Cannot move from UNDER_REVIEW to %', NEW.status;
            END IF;
            
            -- Require decision fields when moving to DECISION_MADE
            IF NEW.status = 'DECISION_MADE' THEN
                IF NEW.decision_outcome IS NULL OR NEW.decision_notes IS NULL OR NEW.reviewed_by IS NULL THEN
                    RAISE EXCEPTION 'Invalid transition: DECISION_MADE requires decision_outcome, decision_notes, and reviewed_by';
                END IF;
            END IF;
        WHEN 'DECISION_MADE' THEN
            IF NEW.status != 'CLOSED' THEN
                RAISE EXCEPTION 'Invalid transition: Cannot move from DECISION_MADE to %', NEW.status;
            END IF;
        WHEN 'CLOSED' THEN
            RAISE EXCEPTION 'Invalid transition: CLOSED is a terminal state';
        ELSE
            RAISE EXCEPTION 'Unknown state transition';
    END CASE;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_appeal_status_transition_trigger ON public.appeals;
CREATE TRIGGER enforce_appeal_status_transition_trigger
    BEFORE INSERT OR UPDATE ON public.appeals
    FOR EACH ROW EXECUTE FUNCTION public.enforce_appeal_status_transition();
