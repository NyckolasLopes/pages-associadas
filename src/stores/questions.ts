import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabaseStorage } from "@/lib/supabaseStorage";

export interface Question {
  id: string;
  produtoId: string;
  produtoNome: string;
  clienteNome: string;
  pergunta: string;
  data: string;
  resposta?: string;
  dataResposta?: string;
}

interface QuestionsState {
  questions: Question[];
  loadQuestions: () => Promise<void>;
  addQuestion: (q: Omit<Question, "id" | "data">) => void;
  answerQuestion: (id: string, resposta: string) => void;
  deleteQuestion: (id: string) => void;
}

export const useQuestions = create<QuestionsState>()(
  persist(
    (set, get) => ({
      questions: [],
      loadQuestions: async () => {
        try {
          const raw = await supabaseStorage.getItem("fa-questions-storage");
          if (raw) {
            const parsed = JSON.parse(raw);
            const stateData = parsed.state || parsed;
            if (stateData.questions && Array.isArray(stateData.questions)) {
              set({ questions: stateData.questions });
            }
          }
        } catch (e) {
          console.warn("Erro ao carregar perguntas compartilhadas:", e);
        }
      },
      addQuestion: (q) =>
        set((state) => ({
          questions: [
            { ...q, id: Date.now().toString(), data: new Date().toISOString() },
            ...state.questions,
          ],
        })),
      answerQuestion: (id, resposta) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === id ? { ...q, resposta, dataResposta: new Date().toISOString() } : q
          ),
        })),
      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),
    }),
    { 
      name: "fa-questions-storage",
      storage: createJSONStorage(() => supabaseStorage)
    }
  )
);

