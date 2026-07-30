import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idb";

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
  addQuestion: (q: Omit<Question, "id" | "data">) => void;
  answerQuestion: (id: string, resposta: string) => void;
  deleteQuestion: (id: string) => void;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    produtoId: "563003",
    produtoNome: "NEVRALGEX 300MG + 50MG + 35MG COM 10 COMPRIMIDOS",
    clienteNome: "João Silva",
    pergunta: "Qual é a data de validade desse lote?",
    data: "2026-07-01T10:00:00Z"
  },
  {
    id: "q2",
    produtoId: "558600",
    produtoNome: "DIAD 1.5MG COM 1 COMPRIMIDO",
    clienteNome: "Maria Souza",
    pergunta: "Como devo tomar este medicamento?",
    data: "2026-07-05T14:30:00Z"
  }
];

export const useQuestions = create<QuestionsState>()(
  persist(
    (set) => ({
      questions: MOCK_QUESTIONS,
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
      name: "fa-questions",
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
