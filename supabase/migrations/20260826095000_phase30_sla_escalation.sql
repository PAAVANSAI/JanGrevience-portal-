-- Phase 30: SLA Escalation
-- Add escalation tracking to grievances

ALTER TABLE public.grievances 
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMP WITH TIME ZONE;

-- Create an index for faster cron querying
CREATE INDEX IF NOT EXISTS idx_grievances_escalation ON public.grievances(status, escalation_level, due_date, last_escalated_at);

-- Add a comment to the table to document the escalation levels
COMMENT ON COLUMN public.grievances.escalation_level IS '0: Standard Officer, 1: Dept Admin, 2: Super Admin';

-- Allow system comments without author_id
ALTER TABLE public.grievance_comments
ALTER COLUMN author_id DROP NOT NULL,
ALTER COLUMN author_role DROP NOT NULL;
