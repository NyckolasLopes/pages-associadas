import { StateStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

/**
 * Storage customizado para Zustand que salva o estado na tabela `app_state` do Supabase
 * garantindo que as configurações da loja nunca sejam perdidas ao limpar cache.
 */
export const supabaseStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('value')
        .eq('key', name)
        .maybeSingle();
      
      if (error) {
        console.error(`Erro ao carregar estado '${name}' do Supabase:`, error);
        return null;
      }
      
      if (data) {
        const globalValue = data.value as any;
        // Restaura a sessão local
        try {
          const localData = localStorage.getItem(`${name}-local`);
          if (localData && globalValue.state) {
            const localParsed = JSON.parse(localData);
            globalValue.state.currentUser = localParsed.currentUser ?? null;
            globalValue.state.activeStoreId = localParsed.activeStoreId ?? null;
          } else if (globalValue.state) {
            globalValue.state.currentUser = null;
            globalValue.state.activeStoreId = null;
          }
        } catch(e) {}
        return JSON.stringify(globalValue);
      }
      return null;
    } catch (err) {
      console.error(`Exceção ao ler '${name}' do Supabase:`, err);
      return null;
    }
  },
  
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const parsedValue = JSON.parse(value);
      
      // Salva sessão apenas localmente
      if (parsedValue.state) {
        const localState = {
          currentUser: parsedValue.state.currentUser,
          activeStoreId: parsedValue.state.activeStoreId
        };
        localStorage.setItem(`${name}-local`, JSON.stringify(localState));
        
        // Remove do global para não logar todo mundo
        delete parsedValue.state.currentUser;
        delete parsedValue.state.activeStoreId;
      }
      
      const { error } = await supabase
        .from('app_state')
        .upsert({ 
          key: name, 
          value: parsedValue,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error(`Erro ao salvar estado '${name}' no Supabase:`, error);
      }
    } catch (err) {
      console.error(`Exceção ao gravar '${name}' no Supabase:`, err);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('app_state')
        .delete()
        .eq('key', name);
        
      if (error) {
        console.error(`Erro ao remover estado '${name}' no Supabase:`, error);
      }
    } catch (err) {
      console.error(`Exceção ao deletar '${name}' do Supabase:`, err);
    }
  },
};
