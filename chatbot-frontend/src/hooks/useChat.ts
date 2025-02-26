import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";
import { useChatStore } from "../store/chatStore";

export function useChatSessions() {
  return useQuery({
    queryKey: ["chatSessions"],
    queryFn: chatApi.getChatSessions,
  });
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: ["chatSession", sessionId],
    queryFn: () => chatApi.getChatSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const addMessage = useChatStore((state) => state.addMessage);
  const currentSession = useChatStore((state) => state.currentSession);

  return useMutation({
    mutationFn: ({ message }: { message: string }) => {
      if (!currentSession) throw new Error("No active session");
      return chatApi.sendMessage(message, currentSession.id);
    },
    onSuccess: (newMessage) => {
      addMessage(newMessage);
      queryClient.invalidateQueries({
        queryKey: ["chatSession", currentSession?.id],
      });
    },
  });
}
