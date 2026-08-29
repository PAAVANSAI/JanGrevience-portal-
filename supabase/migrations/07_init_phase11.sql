-- Phase 11: AI Assistant & Classification

-- 1. Create grievance_priority enum
CREATE TYPE public.grievance_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- 2. Add priority to grievances table
ALTER TABLE public.grievances ADD COLUMN priority public.grievance_priority DEFAULT 'MEDIUM'::public.grievance_priority NOT NULL;

-- 3. Create grievance_ai_classifications table
CREATE TABLE public.grievance_ai_classifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    suggested_department_id UUID REFERENCES public.departments(id),
    suggested_category_id UUID REFERENCES public.categories(id),
    suggested_priority public.grievance_priority,
    confidence INTEGER,
    reasoning TEXT,
    was_accepted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.grievance_ai_classifications ENABLE ROW LEVEL SECURITY;

-- Policies for AI classifications
CREATE POLICY "Citizens can view their own AI classifications"
    ON public.grievance_ai_classifications FOR SELECT
    USING ( auth.uid() = citizen_id );

CREATE POLICY "Officers can view AI classifications for their department"
    ON public.grievance_ai_classifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN')
            AND (department_id = suggested_department_id OR role = 'SUPER_ADMIN')
        )
    );

CREATE POLICY "Citizens can insert AI classifications"
    ON public.grievance_ai_classifications FOR INSERT
    WITH CHECK ( auth.uid() = citizen_id );

CREATE POLICY "Citizens can update their own AI classifications (e.g. to link grievance_id)"
    ON public.grievance_ai_classifications FOR UPDATE
    USING ( auth.uid() = citizen_id );
