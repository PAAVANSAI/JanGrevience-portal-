-- Phase 27: Advanced System Settings
-- This migration adds 4 advanced settings to the system_settings table

-- 1. Maintenance Mode
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'maintenance_mode', 
    'false', 
    'If true, disables citizen submission of new grievances for maintenance.'
)
ON CONFLICT (key) DO NOTHING;

-- 2. Allow Appeals
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'allow_appeals', 
    'true', 
    'If false, hides the appeal button and prevents citizens from reopening resolved cases.'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Appeal Deadline Days
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'appeal_deadline_days', 
    '15', 
    'Number of days after resolution that a citizen is allowed to file an appeal.'
)
ON CONFLICT (key) DO NOTHING;

-- 4. Max Attachment Size (MB)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'max_attachment_size_mb', 
    '10', 
    'Global limit for file attachment uploads by citizens in Megabytes (MB).'
)
ON CONFLICT (key) DO NOTHING;
