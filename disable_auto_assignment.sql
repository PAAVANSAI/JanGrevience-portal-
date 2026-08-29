-- Script to disable automatic grievance assignment
-- Run this in the Supabase SQL Editor.

-- Drop the trigger that automatically assigns grievances upon creation
DROP TRIGGER IF EXISTS trigger_auto_assign_grievance ON public.grievances;

-- Optionally, you can also drop the function if it's no longer needed at all
DROP FUNCTION IF EXISTS public.auto_assign_grievance();
