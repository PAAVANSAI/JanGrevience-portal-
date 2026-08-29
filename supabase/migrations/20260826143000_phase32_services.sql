-- Phase 32: Citizen Services Directory

CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    agency TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    modality TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    apply_url TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policies for services
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Services are viewable by everyone"
    ON public.services FOR SELECT
    USING ( true );

DROP POLICY IF EXISTS "Super Admins can insert services" ON public.services;
CREATE POLICY "Super Admins can insert services"
    ON public.services FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Super Admins can update services" ON public.services;
CREATE POLICY "Super Admins can update services"
    ON public.services FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

DROP POLICY IF EXISTS "Super Admins can delete services" ON public.services;
CREATE POLICY "Super Admins can delete services"
    ON public.services FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
        )
    );

-- Insert some seed data matching the mock
INSERT INTO public.services (title, agency, category, description, modality, timeframe, apply_url) VALUES
('Aadhaar enrolment and update', 'UIDAI', 'Identity & Records', 'Enrol for Aadhaar or update name, address, date of birth, mobile and biometrics.', 'Online + Office visit', 'usually Up to 30 days', 'https://uidai.gov.in/'),
('PAN card application and correction', 'Income Tax Department', 'Identity & Records', 'Apply for a new PAN, request corrections or link PAN with Aadhaar.', 'Online', 'usually 7-15 days', 'https://www.incometax.gov.in/iec/foportal/'),
('Voter registration and roll correction', 'Election Commission of India', 'Identity & Records', 'New voter registration, address shift, corrections and download of e-EPIC.', 'Online', 'usually Up to 30 days', 'https://voters.eci.gov.in/'),
('Passport application and renewal', 'Ministry of External Affairs', 'Identity & Records', 'Fresh passport, reissue, police clearance certificate and appointment booking.', 'Online + Office visit', 'usually 15-30 days after appointment', 'https://www.passportindia.gov.in/'),
('Birth certificate', 'Registrar of Births & Deaths', 'Certificates', 'Register a birth and obtain a certified copy of the birth certificate.', 'Online + Office visit', 'usually 7-21 days', 'https://india.gov.in/'),
('Death certificate', 'Registrar of Births & Deaths', 'Certificates', 'Register a death and obtain certified copies for legal and financial use.', 'Online + Office visit', 'usually 7-21 days', 'https://india.gov.in/'),
('Income, caste and domicile certificate', 'State Revenue Department', 'Certificates', 'Apply for income, caste, residence and domicile certificates through the state portal.', 'Online + Office visit', 'usually 15-30 days', 'https://india.gov.in/'),
('Driving licence services', 'Ministry of Road Transport & Highways', 'Transport', 'Learner''s licence, driving licence, renewal, duplicate and address change.', 'Online + Office visit', 'usually 7-30 days', 'https://parivahan.gov.in/'),
('Vehicle registration and transfer', 'Regional Transport Office', 'Transport', 'Registration certificate, ownership transfer, hypothecation and fitness.', 'Online + Office visit', 'usually 7-30 days', 'https://parivahan.gov.in/'),
('Land records and mutation', 'State Revenue Department', 'Revenue & Property', 'View record of rights, apply for mutation and download land extracts.', 'Online + Office visit', 'usually 30-45 days', 'https://india.gov.in/'),
('Property tax payment', 'Urban Local Body', 'Revenue & Property', 'Assess and pay municipal property tax and download payment receipts.', 'Online', 'usually Immediate', 'https://india.gov.in/'),
('New electricity connection and billing', 'State Electricity Distribution Company', 'Utilities', 'Apply for a new connection, load change, and pay electricity bills.', 'Online', 'usually 7-30 days', 'https://india.gov.in/'),
('Water and sewerage connection', 'Municipal Water Board', 'Utilities', 'New water connection, meter replacement and bill payment.', 'Online + Office visit', 'usually 15-30 days', 'https://india.gov.in/'),
('Ration card services', 'Department of Food & Public Distribution', 'Welfare', 'New ration card, member addition or deletion, and One Nation One Ration Card portability.', 'Online + Office visit', 'usually 15-30 days', 'https://nfsa.gov.in/'),
('Social security pension', 'Department of Rural Development', 'Welfare', 'Old age, widow and disability pension applications under NSAP.', 'Online + Office visit', 'usually 30-45 days', 'https://nsap.nic.in/'),
('DigiLocker document wallet', 'Ministry of Electronics & IT', 'Identity & Records', 'Store and fetch issued documents such as Aadhaar, driving licence, RC and marksheets.', 'Online', 'usually Immediate', 'https://www.digilocker.gov.in/');
