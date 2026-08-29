-- Phase 10: SLA & Escalation

-- 1. Create sla_rules table
CREATE TABLE public.sla_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    target_days INTEGER NOT NULL DEFAULT 7,
    reminder_threshold_percent INTEGER NOT NULL DEFAULT 80,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(category_id)
);

-- Enable RLS
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;

-- SLA Rules Policies
CREATE POLICY "SLA rules are viewable by everyone."
    ON public.sla_rules FOR SELECT
    USING ( true );

CREATE POLICY "SLA rules are insertable by super admin only."
    ON public.sla_rules FOR INSERT
    WITH CHECK ( 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "SLA rules are updatable by super admin only."
    ON public.sla_rules FOR UPDATE
    USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

CREATE POLICY "SLA rules are deletable by super admin only."
    ON public.sla_rules FOR DELETE
    USING ( 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- 2. Update grievances table
ALTER TABLE public.grievances ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;

-- 3. Trigger to auto-set due_date on grievance insert
CREATE OR REPLACE FUNCTION public.set_grievance_due_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_days INTEGER;
BEGIN
    -- Fetch the target_days for the grievance category
    SELECT target_days INTO v_target_days
    FROM public.sla_rules
    WHERE category_id = NEW.category_id AND is_active = true;

    -- If a rule exists, calculate the due_date based on created_at (or now if not set)
    IF v_target_days IS NOT NULL THEN
        IF NEW.created_at IS NOT NULL THEN
            NEW.due_date := NEW.created_at + (v_target_days || ' days')::interval;
        ELSE
            NEW.due_date := timezone('utc'::text, now()) + (v_target_days || ' days')::interval;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_grievance_inserted_set_due_date
    BEFORE INSERT ON public.grievances
    FOR EACH ROW EXECUTE FUNCTION public.set_grievance_due_date();

-- 4. Seed SLA Rules
DO $$
DECLARE
    cat_record RECORD;
    v_target_days INTEGER;
BEGIN
    FOR cat_record IN SELECT id, name FROM public.categories LOOP
        -- Assign some arbitrary SLA days based on category name roughly
        IF cat_record.name ILIKE '%outage%' OR cat_record.name ILIKE '%water supply%' THEN
            v_target_days := 2; -- Urgent
        ELSIF cat_record.name ILIKE '%animal%' OR cat_record.name ILIKE '%sweeping%' OR cat_record.name ILIKE '%garbage%' THEN
            v_target_days := 3;
        ELSIF cat_record.name ILIKE '%billing%' OR cat_record.name ILIKE '%tax%' THEN
            v_target_days := 15;
        ELSIF cat_record.name ILIKE '%licence%' OR cat_record.name ILIKE '%certificate%' THEN
            v_target_days := 10;
        ELSE
            v_target_days := 7; -- Default
        END IF;

        INSERT INTO public.sla_rules (category_id, target_days, reminder_threshold_percent)
        VALUES (cat_record.id, v_target_days, 80)
        ON CONFLICT (category_id) DO NOTHING;
    END LOOP;
END $$;
