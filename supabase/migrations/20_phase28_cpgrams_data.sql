-- Phase 28: Insert Real CPGRAMS Departments and Categories

DO $$
DECLARE
    dept_railways_id UUID;
    dept_telecom_id UUID;
    dept_road_id UUID;
    dept_cbdt_id UUID;
    dept_banking_id UUID;
    dept_mea_id UUID;
    dept_labour_id UUID;
    dept_mha_id UUID;
    dept_posts_id UUID;
BEGIN
    -- Insert CPGRAMS Ministries / Departments
    
    -- 1. Ministry of Railways
    INSERT INTO public.departments (name)
    VALUES ('Ministry of Railways')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_railways_id;
    
    IF dept_railways_id IS NULL THEN
        SELECT id INTO dept_railways_id FROM public.departments WHERE name = 'Ministry of Railways';
    END IF;

    -- 2. Department of Telecommunications
    INSERT INTO public.departments (name)
    VALUES ('Department of Telecommunications')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_telecom_id;

    IF dept_telecom_id IS NULL THEN
        SELECT id INTO dept_telecom_id FROM public.departments WHERE name = 'Department of Telecommunications';
    END IF;

    -- 3. Ministry of Road Transport & Highways
    INSERT INTO public.departments (name)
    VALUES ('Ministry of Road Transport & Highways')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_road_id;

    IF dept_road_id IS NULL THEN
        SELECT id INTO dept_road_id FROM public.departments WHERE name = 'Ministry of Road Transport & Highways';
    END IF;

    -- 4. Central Board of Direct Taxes (Income Tax)
    INSERT INTO public.departments (name)
    VALUES ('Central Board of Direct Taxes (Income Tax)')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_cbdt_id;

    IF dept_cbdt_id IS NULL THEN
        SELECT id INTO dept_cbdt_id FROM public.departments WHERE name = 'Central Board of Direct Taxes (Income Tax)';
    END IF;

    -- 5. Department of Financial Services (Banking Division)
    INSERT INTO public.departments (name)
    VALUES ('Department of Financial Services (Banking)')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_banking_id;

    IF dept_banking_id IS NULL THEN
        SELECT id INTO dept_banking_id FROM public.departments WHERE name = 'Department of Financial Services (Banking)';
    END IF;

    -- 6. Ministry of External Affairs (Passport)
    INSERT INTO public.departments (name)
    VALUES ('Ministry of External Affairs (Passport)')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_mea_id;

    IF dept_mea_id IS NULL THEN
        SELECT id INTO dept_mea_id FROM public.departments WHERE name = 'Ministry of External Affairs (Passport)';
    END IF;

    -- 7. Ministry of Labour and Employment (EPFO)
    INSERT INTO public.departments (name)
    VALUES ('Ministry of Labour and Employment')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_labour_id;

    IF dept_labour_id IS NULL THEN
        SELECT id INTO dept_labour_id FROM public.departments WHERE name = 'Ministry of Labour and Employment';
    END IF;

    -- 8. Ministry of Home Affairs
    INSERT INTO public.departments (name)
    VALUES ('Ministry of Home Affairs')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_mha_id;

    IF dept_mha_id IS NULL THEN
        SELECT id INTO dept_mha_id FROM public.departments WHERE name = 'Ministry of Home Affairs';
    END IF;

    -- 9. Department of Posts
    INSERT INTO public.departments (name)
    VALUES ('Department of Posts')
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO dept_posts_id;

    IF dept_posts_id IS NULL THEN
        SELECT id INTO dept_posts_id FROM public.departments WHERE name = 'Department of Posts';
    END IF;

    -- ========================================================
    -- Insert CPGRAMS Categories
    -- ========================================================

    -- Railways
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Train Punctuality / Delays') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Ticketing and Refund Issues') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Catering Quality / Overcharging') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Cleanliness and Hygiene on Train/Station') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Security and Theft') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_railways_id, 'Bribery / Corruption') ON CONFLICT DO NOTHING;

    -- Telecom
    INSERT INTO public.categories (department_id, name) VALUES (dept_telecom_id, 'Billing and Tariff Disputes') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_telecom_id, 'Network / Broadband Connectivity Issues') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_telecom_id, 'Service Activation / Deactivation') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_telecom_id, 'SIM Porting (MNP) Issues') ON CONFLICT DO NOTHING;

    -- Road Transport & Highways
    INSERT INTO public.categories (department_id, name) VALUES (dept_road_id, 'Toll Plaza Issues / Harassment') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_road_id, 'Highway Maintenance / Potholes') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_road_id, 'FASTag Disputes / Double Deduction') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_road_id, 'Road Safety Issues') ON CONFLICT DO NOTHING;

    -- CBDT (Income Tax)
    INSERT INTO public.categories (department_id, name) VALUES (dept_cbdt_id, 'Income Tax Refund Delays') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_cbdt_id, 'PAN Card Issuance / Correction') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_cbdt_id, 'E-Filing Portal Glitches') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_cbdt_id, 'Notice Clarifications / Rectifications') ON CONFLICT DO NOTHING;

    -- Financial Services (Banking)
    INSERT INTO public.categories (department_id, name) VALUES (dept_banking_id, 'ATM / Debit Card Failures') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_banking_id, 'Unauthorised Online Transactions / Fraud') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_banking_id, 'Loan / EMI Grievances') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_banking_id, 'Account Frozen / Blocked Unjustly') ON CONFLICT DO NOTHING;

    -- External Affairs (Passport)
    INSERT INTO public.categories (department_id, name) VALUES (dept_mea_id, 'Application Processing Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mea_id, 'Police Verification Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mea_id, 'Passport Printing / Dispatch Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mea_id, 'Correction in Passport Details') ON CONFLICT DO NOTHING;

    -- Labour and Employment (EPFO)
    INSERT INTO public.categories (department_id, name) VALUES (dept_labour_id, 'PF Withdrawal / Transfer Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_labour_id, 'EPFO KYC Updation Issues') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_labour_id, 'Pension Settlement Delays') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_labour_id, 'Employer Non-Compliance / Non-Payment') ON CONFLICT DO NOTHING;

    -- Home Affairs
    INSERT INTO public.categories (department_id, name) VALUES (dept_mha_id, 'Cybercrime Complaints') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mha_id, 'Law and Order Situation') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mha_id, 'Visa / Immigration Delays') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_mha_id, 'Freedom Fighter Pension Issues') ON CONFLICT DO NOTHING;

    -- Posts
    INSERT INTO public.categories (department_id, name) VALUES (dept_posts_id, 'Parcel / Speed Post Delivery Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_posts_id, 'Lost or Damaged Article') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_posts_id, 'Money Order Delay') ON CONFLICT DO NOTHING;
    INSERT INTO public.categories (department_id, name) VALUES (dept_posts_id, 'Post Office Savings Scheme Issues') ON CONFLICT DO NOTHING;

END $$;
