// @ts-nocheck
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
        // @ts-ignore
        .eq('key', name)
        .maybeSingle();
      
      if (error && error.code !== '42501') {
        console.error(`Erro ao carregar estado '${name}' do Supabase:`, error);
      }
      
      if (data && data.value) {
        // @ts-ignore
        const globalValue = data.value as any;
        
        // Salva um backup completo localmente para caso o Supabase fique offline
        try {
          localStorage.setItem(`${name}-backup`, JSON.stringify(globalValue));
        } catch(e) {}
        
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
      
      // FALLBACK SE NÃO RETORNOU DADOS (ex: RLS bloqueou por sessão expirada) OU DEU ERRO
      console.warn(`Estado '${name}' não retornado pelo Supabase (ou com erro). Tentando backup local...`);
      try {
        const backup = localStorage.getItem(`${name}-backup`);
        if (backup) {
          const globalValue = JSON.parse(backup);
          const localData = localStorage.getItem(`${name}-local`);
          if (localData && globalValue.state) {
            const localParsed = JSON.parse(localData);
            globalValue.state.currentUser = localParsed.currentUser ?? null;
            globalValue.state.activeStoreId = localParsed.activeStoreId ?? null;
          }
          return JSON.stringify(globalValue);
        }
      } catch (e) {
        console.error("Erro ao ler backup local:", e);
      }
      
      return null;
    } catch (err) {
      console.error(`Exceção ao ler '${name}' do Supabase:`, err);
      // Tenta recuperar do backup local em caso de falha na rede
      try {
        const backup = localStorage.getItem(`${name}-backup`);
        if (backup) {
          const globalValue = JSON.parse(backup);
          const localData = localStorage.getItem(`${name}-local`);
          if (localData && globalValue.state) {
            const localParsed = JSON.parse(localData);
            globalValue.state.currentUser = localParsed.currentUser ?? null;
            globalValue.state.activeStoreId = localParsed.activeStoreId ?? null;
          }
          return JSON.stringify(globalValue);
        }
      } catch (e) {}
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
        
        // Mantém um backup completo do estado caso a rede caia
        localStorage.setItem(`${name}-backup`, value);
        
        // Remove do global para não logar todo mundo
        delete parsedValue.state.currentUser;
        delete parsedValue.state.activeStoreId;
      }
      
      const { error } = await supabase
        // @ts-ignore
        .from('app_state')
        .upsert({ 
          // @ts-ignore
          key: name, 
          value: parsedValue,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        if (error.code !== '42501') {
          console.error(`Erro ao salvar estado '${name}' no Supabase:`, error);
        }
      }
    } catch (err) {
      console.error(`Exceção ao gravar '${name}' no Supabase:`, err);
    }
  },
  
  removeItem: async (name: string): Promise<void> => {
    try {
      const { error } = await supabase
        // @ts-ignore
        .from('app_state')
        .delete()
        // @ts-ignore
        .eq('key', name);
        
      if (error && error.code !== '42501') {
        console.error(`Erro ao remover estado '${name}' no Supabase:`, error);
      }
    } catch (err) {
      console.error(`Exceção ao deletar '${name}' do Supabase:`, err);
    }
  },
};