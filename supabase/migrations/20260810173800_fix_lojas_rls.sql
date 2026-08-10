CREATE POLICY "Lojas: public insert" ON public.lojas FOR INSERT WITH CHECK (true);
CREATE POLICY "Lojas: public update" ON public.lojas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Lojas: public delete" ON public.lojas FOR DELETE USING (true);
