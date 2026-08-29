-- Phase 20: Department Contacts
-- This table stores contact information for the nodal officers of each department.

CREATE TABLE IF NOT EXISTS public.department_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    officer_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(department_id)
);

-- Enable RLS
ALTER TABLE public.department_contacts ENABLE ROW LEVEL SECURITY;

-- Read Access: Public (Visible to logged-out and logged-in users)
CREATE POLICY "Department contacts are viewable by everyone" 
    ON public.department_contacts FOR SELECT 
    USING (true);

-- Write Access: Super Admins only
CREATE POLICY "Super Admins can insert department contacts" 
    ON public.department_contacts FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "Super Admins can update department contacts" 
    ON public.department_contacts FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "Super Admins can delete department contacts" 
    ON public.department_contacts FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'SUPER_ADMIN'
        )
    );

-- Seed data for existing departments
-- (Assuming some existing departments from earlier phases; we'll insert dummy data for them if they exist)
INSERT INTO public.department_contacts (department_id, officer_name, designation, phone, email, address)
SELECT 
    id,
    'Nodal Officer - ' || name,
    'Director, Public Grievances',
    '1800-111-222',
    'contact@' || lower(regexp_replace(name, '\s+', '', 'g')) || '.gov.in',
    'Headquarters, Secretariat Building, New Delhi'
FROM public.departments
ON CONFLICT (department_id) DO NOTHING;
