-- Phase 26: Location Admin
-- Add INSERT, UPDATE, DELETE RLS policies to states and districts for SUPER_ADMIN

-- States Policies
CREATE POLICY "States are insertable by SUPER_ADMIN" ON public.states FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "States are updatable by SUPER_ADMIN" ON public.states FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "States are deletable by SUPER_ADMIN" ON public.states FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Districts Policies
CREATE POLICY "Districts are insertable by SUPER_ADMIN" ON public.districts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Districts are updatable by SUPER_ADMIN" ON public.districts FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
CREATE POLICY "Districts are deletable by SUPER_ADMIN" ON public.districts FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
