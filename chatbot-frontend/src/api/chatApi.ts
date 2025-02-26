import axios from "axios";
import { Message, ChatSession } from "../types/chat";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

export const chatApi = {
  sendMessage: async (message: string, sessionId: string): Promise<Message> => {
    const { data } = await api.post("/chat/message", { message, sessionId });
    return data;
  },

  getChatSessions: async (): Promise<ChatSession[]> => {
    const { data } = await api.get("/chat/sessions");
    return data;
  },

  getChatSession: async (sessionId: string): Promise<ChatSession> => {
    const { data } = await api.get(`/chat/sessions/${sessionId}`);
    return data;
  },
};
