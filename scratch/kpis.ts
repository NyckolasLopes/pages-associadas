export function useOrdersKpis(lojaId?: string) {
  return useQuery({
    queryKey: ['orders-kpis', lojaId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        return { concluidos: 0, pendentes: 0, cancelados: 0, total: 0 };
      }

      const { data: rawProfile } = await supabase
        .from('profiles' as any)
        .select('is_admin, lojas_vinculadas')
        .eq('id', user.id)
        .single();
      const profile = rawProfile as any;

      let query = supabase.from('pedidos').select('status');

      if (!profile?.is_admin) {
        if (profile?.lojas_vinculadas && profile.lojas_vinculadas.length > 0) {
          const lojaIds = Array.isArray(profile.lojas_vinculadas)
            ? profile.lojas_vinculadas
            : Object.keys(profile.lojas_vinculadas);
          query = query.in('loja_id', lojaIds);
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      if (lojaId) {
        query = query.eq('loja_id', lojaId);
      }
      
      const { data, error } = await query;
      if (error) return { concluidos: 0, pendentes: 0, cancelados: 0, total: 0 };
      
      let concluidos = 0;
      let pendentes = 0;
      let cancelados = 0;
      
      (data || []).forEach((d: any) => {
        const st = (d.status || "").toLowerCase();
        if (st.includes("conclu")) concluidos++;
        else if (st.includes("cancel")) cancelados++;
        else pendentes++;
      });
      
      return { concluidos, pendentes, cancelados, total: (data || []).length };
    },
    staleTime: 1000 * 60,
  });
}
