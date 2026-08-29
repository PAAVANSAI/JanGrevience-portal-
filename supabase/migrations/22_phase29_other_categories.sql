-- Phase 29: Add 'Other' Department and Categories

DO $$
DECLARE
    v_dept_id UUID;
    dept RECORD;
BEGIN
    -- 1. Create a global "Other / Not Sure" Department if it doesn't exist
    SELECT id INTO v_dept_id FROM public.departments WHERE name = 'Other / Not Sure';
    
    IF v_dept_id IS NULL THEN
        INSERT INTO public.departments (name, description, is_active)
        VALUES (
            'Other / Not Sure', 
            'Select this if you are unsure which department handles your grievance. It will be manually routed by an administrator.', 
            true
        )
        RETURNING id INTO v_dept_id;
    END IF;

    -- 2. Ensure EVERY department has an "Other / Uncategorized" category
    FOR dept IN SELECT id FROM public.departments LOOP
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE department_id = dept.id AND name = 'Other / Uncategorized') THEN
            INSERT INTO public.categories (department_id, name, description, is_active)
            VALUES (
                dept.id, 
                'Other / Uncategorized', 
                'For issues that do not fit into standard categories for this department.', 
                true
            );
        END IF;
    END LOOP;
END $$;
