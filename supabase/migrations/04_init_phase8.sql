-- =================================================================================
-- PHASE 8: NOTIFICATIONS & REAL-TIME
-- Adds notifications table, auto-creation triggers, and enables Supabase Realtime.
-- =================================================================================

-- 1. Create Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'STATUS_CHANGED', 'COMMENT_ADDED', 'ASSIGNED', 'INFO_REQUESTED'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark read)"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. Triggers for Auto-Creation

-- A. Notify Citizen on Status Change
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    msg TEXT;
    notif_type TEXT := 'STATUS_CHANGED';
BEGIN
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'ADDITIONAL_INFORMATION_REQUIRED' THEN
        msg := 'Officer requested more information on grievance ' || NEW.grievance_number;
        notif_type := 'INFO_REQUESTED';
    ELSIF NEW.status = 'RESOLVED' THEN
        msg := 'Your grievance ' || NEW.grievance_number || ' has been resolved.';
    ELSIF NEW.status = 'REJECTED' THEN
        msg := 'Your grievance ' || NEW.grievance_number || ' was rejected.';
    ELSIF NEW.status = 'ACTION_TAKEN' THEN
        msg := 'Action has been taken on your grievance ' || NEW.grievance_number || '.';
    ELSIF NEW.status = 'ASSIGNED' THEN
        msg := 'Your grievance ' || NEW.grievance_number || ' has been assigned to an officer.';
    ELSE
        msg := 'Your grievance ' || NEW.grievance_number || ' status changed to ' || NEW.status || '.';
    END IF;

    -- Insert for the citizen
    INSERT INTO public.notifications (user_id, grievance_id, type, message)
    VALUES (NEW.citizen_id, NEW.id, notif_type, msg);

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_status_change ON public.grievances;
CREATE TRIGGER trigger_notify_on_status_change
    AFTER UPDATE OF status ON public.grievances
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_status_change();


-- B. Notify the other party on new Comment
CREATE OR REPLACE FUNCTION public.notify_on_new_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    grievance_record RECORD;
    assignment_record RECORD;
    msg TEXT;
BEGIN
    -- Only trigger if visible to citizen (for this phase, they all are)
    IF NOT NEW.is_visible_to_citizen THEN
        RETURN NEW;
    END IF;

    -- Get grievance details
    SELECT * INTO grievance_record FROM public.grievances WHERE id = NEW.grievance_id;

    IF NEW.author_role = 'CITIZEN' THEN
        -- Citizen commented, notify the assigned officer(s)
        msg := 'Citizen added a reply to grievance ' || grievance_record.grievance_number;
        
        FOR assignment_record IN (SELECT officer_id FROM public.grievance_assignments WHERE grievance_id = NEW.grievance_id)
        LOOP
            INSERT INTO public.notifications (user_id, grievance_id, type, message)
            VALUES (assignment_record.officer_id, NEW.grievance_id, 'COMMENT_ADDED', msg);
        END LOOP;

    ELSE
        -- Officer commented, notify the citizen
        msg := 'Department added a note to your grievance ' || grievance_record.grievance_number;
        
        INSERT INTO public.notifications (user_id, grievance_id, type, message)
        VALUES (grievance_record.citizen_id, NEW.grievance_id, 'COMMENT_ADDED', msg);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_new_comment ON public.grievance_comments;
CREATE TRIGGER trigger_notify_on_new_comment
    AFTER INSERT ON public.grievance_comments
    FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_comment();

-- 3. Enable Realtime Configuration
-- We need to enable REPLICA IDENTITY FULL for tables we want to receive row updates for, 
-- but default is usually fine for INSERTs. 
-- We add the tables to the supabase_realtime publication.

-- Note: In Supabase, if the publication doesn't exist, this will error. 
-- Usually, it exists by default. We do DO block to handle safely.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication
        WHERE pubname = 'supabase_realtime'
    ) THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grievances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grievance_comments;
