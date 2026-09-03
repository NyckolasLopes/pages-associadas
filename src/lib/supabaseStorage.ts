// @ts-nocheck
import { StateStorage } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

/**
 * Storage customizado para Zustand que salva o estado na tabela `app_state` do Supabase
 * garantindo que as configurações da loja nunca sejam perdidas ao limpar cache.
 *
 * CORREÇÕES:
 * 1. Debounce de 2s no setItem — evita flood de escritas no Supabase a cada mudança de estado
 * 2. currentUser preservado corretamente — não derruba sessão quando backup local não existe
 * 3. Backup localStorage sempre atualizado para garantir fallback confiável
 */

// Debounce: acumula chamadas e só salva no Supabase após 2s de inatividade
const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();
const pendingValues = new Map<string, string>();

function scheduleSupabaseWrite(name: string, parsedValue: any) {
  // Cancela escrita anterior pendente para este nome
  if (pendingWrites.has(name)) {
    clearTimeout(pendingWrites.get(name)!);
  }
  pendingValues.set(name, parsedValue);

  const timer = setTimeout(async () => {
    pendingWrites.delete(name);
    const val = pendingValues.get(name);
    pendingValues.delete(name);
    if (val === undefined) return;

    try {
      let saved = false;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { error } = await supabase
          // @ts-ignore
          .from('app_state')
          .upsert({
            // @ts-ignore
            key: name,
            value: val,
            updated_at: new Date().toISOString(),
          });

        if (!error) {
          saved = true;
        }
      }

      // Se não conseguiu via cliente direto (ex: sem sessão ou bloqueio RLS), aciona fallback do backend
      if (!saved && typeof window !== 'undefined') {
        try {
          await fetch('/api/admin/save-app-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: name, value: val })
          });
        } catch (apiErr) {}
      }
    } catch (err) {
      // Fallback silencioso
    }
  }, 1500);

  pendingWrites.set(name, timer);
}

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
        } catch (e) {}

        // Sessões de usuário nunca devem ser restauradas via app_state compartilhado
        if (globalValue.state) {
          delete globalValue.state.currentUser;
        }

        return JSON.stringify(globalValue);
      }

      // FALLBACK: Supabase não retornou dados — usa backup local
      try {
        const backup = localStorage.getItem(`${name}-backup`);
        if (backup) {
          const globalValue = JSON.parse(backup);
          if (globalValue.state) {
            delete globalValue.state.currentUser;
          }
          return JSON.stringify(globalValue);
        }
      } catch (e) {}

      return null;
    } catch (err) {
      console.error(`Exceção ao ler '${name}' do Supabase:`, err);
      try {
        const backup = localStorage.getItem(`${name}-backup`);
        if (backup) {
          const globalValue = JSON.parse(backup);
          if (globalValue.state) {
            delete globalValue.state.currentUser;
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

      if (parsedValue.state) {
        // Mantém um backup completo do estado caso a rede caia
        localStorage.setItem(`${name}-backup`, value);

        // Remove campos de sessão do payload global (não logar todo mundo no banco)
        delete parsedValue.state.currentUser;
        delete parsedValue.state.activeStoreId;
      }

      // Debounce a escrita no Supabase — evita flood de requisições
      scheduleSupabaseWrite(name, parsedValue);
    } catch (err) {
      console.error(`Exceção ao preparar '${name}' para gravação:`, err);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    // Cancela qualquer escrita pendente
    if (pendingWrites.has(name)) {
      clearTimeout(pendingWrites.get(name)!);
      pendingWrites.delete(name);
    }
    pendingValues.delete(name);

    try {
      const { error } = await supabase
        // @ts-ignore
        .from('app_state')
        .delete()
        // @ts-ignore
        .eq('key', name);

      if (error && error.code !== '42501') {
        console.error(`Erro ao remover estado '${name}' do Supabase:`, error);
      }
    } catch (err) {
      console.error(`Exceção ao deletar '${name}' do Supabase:`, err);
    }
  },
};