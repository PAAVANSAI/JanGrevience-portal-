-- Phase 29: Add descriptions to CPGRAMS departments

UPDATE public.departments SET description = 'Handles grievances related to train delays, ticketing, cleanliness, catering, and railway security.' WHERE name = 'Ministry of Railways';

UPDATE public.departments SET description = 'Handles grievances related to telecom billing, broadband connectivity, and mobile service providers.' WHERE name = 'Department of Telecommunications';

UPDATE public.departments SET description = 'Handles grievances related to national highways, toll plazas, FASTag disputes, and road safety.' WHERE name = 'Ministry of Road Transport & Highways';

UPDATE public.departments SET description = 'Handles grievances related to income tax refunds, PAN cards, and e-filing portal issues.' WHERE name = 'Central Board of Direct Taxes (Income Tax)';

UPDATE public.departments SET description = 'Handles grievances related to banking services, ATM failures, online fraud, and loan disputes.' WHERE name = 'Department of Financial Services (Banking)';

UPDATE public.departments SET description = 'Handles grievances related to passport issuance, police verification delays, and corrections.' WHERE name = 'Ministry of External Affairs (Passport)';

UPDATE public.departments SET description = 'Handles grievances related to PF withdrawal, EPFO KYC updates, and pension settlements.' WHERE name = 'Ministry of Labour and Employment';

UPDATE public.departments SET description = 'Handles grievances related to cybercrime, law and order, and immigration delays.' WHERE name = 'Ministry of Home Affairs';

UPDATE public.departments SET description = 'Handles grievances related to parcel delivery delays, lost articles, and post office savings.' WHERE name = 'Department of Posts';
