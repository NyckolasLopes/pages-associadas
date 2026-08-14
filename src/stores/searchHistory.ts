import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SearchHistoryState {
  history: Record<string, Record<string, number>>;
  logSearch: (lojaId: string, term: string) => void;
  getTopTerms: (lojaId: string, limit?: number) => string[];
}

export const useSearchHistory = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      history: {},

      logSearch: (lojaId: string, term: string) => {
        if (!term || term.trim() === '') return;
        
        // Clean and normalize term
        const cleanTerm = term.trim().toLowerCase();
        // Ignore very small terms
        if (cleanTerm.length < 3) return;

        set((state) => {
          const storeHistory = state.history[lojaId] || {};
          const currentCount = storeHistory[cleanTerm] || 0;
          
          return {
            history: {
              ...state.history,
              [lojaId]: {
                ...storeHistory,
                [cleanTerm]: currentCount + 1,
              },
            },
          };
        });
      },

      getTopTerms: (lojaId: string, limit: number = 15) => {
        const storeHistory = get().history[lojaId];
        if (!storeHistory) return [];

        // Convert the record to array of [term, count], sort by count descending
        const sortedEntries = Object.entries(storeHistory)
          .sort(([, countA], [, countB]) => countB - countA);

        return sortedEntries.slice(0, limit).map(([term]) => term);
      },
    }),
    {
      name: 'fa_search_history',
    }
  )
);
