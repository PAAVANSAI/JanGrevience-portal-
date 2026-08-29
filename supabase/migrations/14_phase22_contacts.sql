-- Phase 22: Public Contact Us Directory
-- Modify department_contacts to allow general contacts and multiple contacts per department

-- 1. Drop the unique constraint on department_id
ALTER TABLE public.department_contacts DROP CONSTRAINT IF EXISTS department_contacts_department_id_key;

-- 2. Make department_id nullable to allow general contacts (system-wide)
ALTER TABLE public.department_contacts ALTER COLUMN department_id DROP NOT NULL;

-- 3. Add dealing_with column for subject area context
ALTER TABLE public.department_contacts ADD COLUMN IF NOT EXISTS dealing_with TEXT;

-- 4. Insert dummy seed data (if not already present from phase 20)
-- Clear out the auto-generated dummy data from Phase 20 first if we want a fresh set
-- Wait, Phase 20 inserted data if department_id was unique. We'll leave existing data but add the new field for them, 
-- and insert our new dummy data explicitly.

UPDATE public.department_contacts SET dealing_with = 'General Department Queries' WHERE dealing_with IS NULL;

-- Insert general contacts (department_id is NULL)
INSERT INTO public.department_contacts (department_id, officer_name, designation, dealing_with, phone, email, address)
VALUES 
    (NULL, 'Rakesh Kumar', 'Director of Public Grievances', 'Platform Oversight and Escalations', '1800-555-0101', 'director.pg@jangrievance.gov.in', 'Room 101, Grievance Cell HQ, New Delhi'),
    (NULL, 'Anita Sharma', 'Under Secretary', 'Citizen Support & Outreach', '1800-555-0102', 'support@jangrievance.gov.in', 'Room 102, Grievance Cell HQ, New Delhi');

-- Insert fictional department-specific contacts (we'll just use NULL for department_id here if we want them to show up, 
-- or try to link to an existing department. It's safer to just link them to arbitrary departments or leave them general 
-- for the public page dummy data to ensure they always show up regardless of the environment's department list).
-- We'll insert a few more general ones to act as the "dummy data" for the directory.

INSERT INTO public.department_contacts (department_id, officer_name, designation, dealing_with, phone, email, address)
VALUES 
    (NULL, 'Vikram Singh', 'Joint Secretary', 'Policy and Administration', '1800-555-0103', 'policy@jangrievance.gov.in', 'Grievance Cell HQ, New Delhi'),
    (NULL, 'Priya Patel', 'Nodal Officer', 'Technical Support', '1800-555-0104', 'tech@jangrievance.gov.in', 'Grievance Cell HQ, New Delhi'),
    (NULL, 'Dr. A. K. Verma', 'Chief Medical Officer', 'Health Department Grievances', '1800-555-0105', 'health@jangrievance.gov.in', 'Health Secretariat, New Delhi'),
    (NULL, 'Suresh Reddy', 'Superintending Engineer', 'Public Works and Roads', '1800-555-0106', 'pwd@jangrievance.gov.in', 'Public Works Office, New Delhi');
