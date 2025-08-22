import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Message, ChatSession } from "../types";

interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentSession: (session: ChatSession) => void;
  addMessage: (message: Message) => void;
  createNewSession: () => void;
  clearCurrentSession: () => void;
  setSessions: (sessions: ChatSession[]) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        currentSession: null,
        sessions: [],
        isLoading: false,
        error: null,

        setCurrentSession: (session) => set({ currentSession: session }),
        addMessage: (message) =>
          set((state) => ({
            currentSession: state.currentSession
              ? {
                  ...state.currentSession,
                  messages: [...state.currentSession.messages, message],
                  updatedAt: new Date(),
                }
              : null,
          })),
        createNewSession: () =>
          set({
            currentSession: {
              id: crypto.randomUUID(),
              messages: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }),
        clearCurrentSession: () => set({ currentSession: null }),
        setSessions: (sessions) => set({ sessions }),
        setError: (error) => set({ error }),
        setLoading: (isLoading) => set({ isLoading }),
      }),
      {
        name: "chat-storage",
      }
    )
  )
);
