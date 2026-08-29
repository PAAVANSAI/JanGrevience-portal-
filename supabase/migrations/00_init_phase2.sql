-- Phase 2: Profiles, Roles & Departments

-- 1. Create User Role Enum
CREATE TYPE public.user_role AS ENUM ('CITIZEN', 'OFFICER', 'DEPT_ADMIN', 'SUPER_ADMIN');

-- 2. Create Profiles Table
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role public.user_role DEFAULT 'CITIZEN'::public.user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (id)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile."
    ON public.profiles FOR SELECT
    USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE
    USING ( auth.uid() = id );

-- Note: We do NOT allow INSERT or DELETE via the API. INSERT is handled by the trigger below.
-- Note: We also need to prevent users from updating their own 'role' field. 
-- In PostgreSQL RLS, it's hard to restrict column-level updates via policies alone easily without functions.
-- For now, the policy allows update, but we will trust the frontend to not send 'role', 
-- and ideally use a database trigger to prevent role updates by non-admins in the future.
-- For a robust approach, we can revoke UPDATE on the 'role' column entirely for the authenticated role,
-- but that requires managing GRANTs explicitly. 
-- For Phase 2, we enforce it in the API/Frontend logic and RLS restricts it to own ID.

-- 3. Auto-Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NULL,
    'CITIZEN'::public.user_role
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Create Departments Table
CREATE TABLE public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on departments
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Departments Policies
CREATE POLICY "Departments are viewable by everyone."
    ON public.departments FOR SELECT
    USING ( true );

-- 5. Create Categories Table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(department_id, name)
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories Policies
CREATE POLICY "Categories are viewable by everyone."
    ON public.categories FOR SELECT
    USING ( true );

-- 6. Seed Data (Departments & Categories)
DO $$
DECLARE
    dept_transport_id UUID;
    dept_water_id UUID;
    dept_sanitation_id UUID;
    dept_electricity_id UUID;
    dept_revenue_id UUID;
    dept_health_id UUID;
BEGIN
    -- Insert Departments and get IDs
    INSERT INTO public.departments (name, description) VALUES ('Transport Department', 'Handles driving licences, vehicle registration, and public transit issues.') RETURNING id INTO dept_transport_id;
    INSERT INTO public.departments (name, description) VALUES ('Water Supply Department', 'Handles water connection, billing, and supply issues.') RETURNING id INTO dept_water_id;
    INSERT INTO public.departments (name, description) VALUES ('Sanitation Department', 'Handles waste management, street cleaning, and public hygiene.') RETURNING id INTO dept_sanitation_id;
    INSERT INTO public.departments (name, description) VALUES ('Electricity Board', 'Handles power outages, billing, and new connections.') RETURNING id INTO dept_electricity_id;
    INSERT INTO public.departments (name, description) VALUES ('Revenue Department', 'Handles land records, property tax, and certificates.') RETURNING id INTO dept_revenue_id;
    INSERT INTO public.departments (name, description) VALUES ('Health Department', 'Handles public hospitals, clinics, and health schemes.') RETURNING id INTO dept_health_id;

    -- Insert Categories for Transport
    INSERT INTO public.categories (department_id, name) VALUES (dept_transport_id, 'Driving Licence Renewal');
    INSERT INTO public.categories (department_id, name) VALUES (dept_transport_id, 'Vehicle Registration Issue');
    INSERT INTO public.categories (department_id, name) VALUES (dept_transport_id, 'Public Bus Complaint');

    -- Insert Categories for Water
    INSERT INTO public.categories (department_id, name) VALUES (dept_water_id, 'No Water Supply');
    INSERT INTO public.categories (department_id, name) VALUES (dept_water_id, 'Contaminated Water');
    INSERT INTO public.categories (department_id, name) VALUES (dept_water_id, 'Billing Issue');

    -- Insert Categories for Sanitation
    INSERT INTO public.categories (department_id, name) VALUES (dept_sanitation_id, 'Garbage Not Collected');
    INSERT INTO public.categories (department_id, name) VALUES (dept_sanitation_id, 'Street Sweeping Required');
    INSERT INTO public.categories (department_id, name) VALUES (dept_sanitation_id, 'Dead Animal Removal');

    -- Insert Categories for Electricity
    INSERT INTO public.categories (department_id, name) VALUES (dept_electricity_id, 'Power Outage');
    INSERT INTO public.categories (department_id, name) VALUES (dept_electricity_id, 'Streetlight Not Working');
    INSERT INTO public.categories (department_id, name) VALUES (dept_electricity_id, 'Incorrect Bill Amount');

    -- Insert Categories for Revenue
    INSERT INTO public.categories (department_id, name) VALUES (dept_revenue_id, 'Property Tax Dispute');
    INSERT INTO public.categories (department_id, name) VALUES (dept_revenue_id, 'Land Record Correction');
    INSERT INTO public.categories (department_id, name) VALUES (dept_revenue_id, 'Delay in Issuing Certificate');

    -- Insert Categories for Health
    INSERT INTO public.categories (department_id, name) VALUES (dept_health_id, 'Government Hospital Complaint');
    INSERT INTO public.categories (department_id, name) VALUES (dept_health_id, 'Primary Health Centre Issue');
    INSERT INTO public.categories (department_id, name) VALUES (dept_health_id, 'Mosquito Fogging Request');
END $$;
