import { useState, useEffect } from "react";
import { ChatService } from "../services";
import { Message, Conversation } from "../types";
import { error as toastError } from "../lib/toast";

/**
 * 채팅 관리를 위한 커스텀 훅
 */
export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // 현재 활성 대화
  const activeConversation = conversations.find(
    (conv) => conv.id === activeChatId
  );

  // 대화 목록 불러오기
  const fetchConversations = async () => {
    try {
      const data = await ChatService.getConversations();
      setConversations(data);

      // 첫 번째 대화를 활성화
      if (data.length > 0 && !activeChatId) {
        setActiveChatId(data[0].id);
      }
    } catch (error) {
      console.error("대화 목록 불러오기 실패:", error);
    }
  };

  // 메시지 전송
  const sendMessage = async (message: string) => {
    if (!activeChatId || !message.trim()) return;

    setLoading(true);
    try {
      const userMessage: Message = {
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      };

      // UI에 사용자 메시지 즉시 반영
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeChatId
            ? { ...conv, messages: [...conv.messages, userMessage] }
            : conv
        )
      );

      // AI 응답 받기
      const aiResponse = await ChatService.sendMessage(activeChatId, message);

      // AI 응답을 UI에 추가
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeChatId
            ? { ...conv, messages: [...conv.messages, aiResponse] }
            : conv
        )
      );

      // 대화 목록 갱신
      await fetchConversations();
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      toastError("메시지 전송에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 새 대화 시작
  const startNewChat = async () => {
    try {
      const newChat = await ChatService.createConversation();
      setConversations((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } catch (error) {
      console.error("새 대화 시작 실패:", error);
      toastError("새 대화를 시작할 수 없습니다.");
    }
  };

  // 대화방 삭제
  const deleteChat = async (chatId: number) => {
    if (!window.confirm("이 대화를 삭제하시겠습니까?")) return;

    try {
      await ChatService.deleteConversation(chatId);
      const updated = conversations.filter((chat) => chat.id !== chatId);
      setConversations(updated);

      if (activeChatId === chatId) {
        setActiveChatId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (error) {
      console.error("대화방 삭제 실패:", error);
      toastError("대화방을 삭제하는데 실패했습니다.");
    }
  };

  // 대화방 제목 변경
  const updateChatTitle = async (chatId: number, newTitle: string) => {
    try {
      await ChatService.updateConversationTitle(chatId, newTitle);
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error("대화방 이름 변경 실패:", error);
      toastError("대화방 이름 변경에 실패했습니다.");
    }
  };

  // 대화방 고정/해제
  const toggleChatPin = async (chatId: number) => {
    try {
      // 현재 대화의 pinned 상태를 찾기
      const currentConversation = conversations.find((c) => c.id === chatId);
      if (!currentConversation) {
        throw new Error("대화를 찾을 수 없습니다.");
      }

      // 현재 상태의 반대값으로 토글
      const newPinnedState = !currentConversation.pinned;

      const updatedConversation = await ChatService.toggleConversationPin(
        chatId,
        newPinnedState
      );

      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? updatedConversation : c))
      );
    } catch (error) {
      console.error("대화방 고정/해제 실패:", error);
      toastError("대화방 고정/해제에 실패했습니다.");
    }
  };

  // 컴포넌트 마운트 시 대화 목록 불러오기
  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    conversations,
    activeConversation,
    activeChatId,
    loading,
    setActiveChatId,
    sendMessage,
    startNewChat,
    deleteChat,
    updateChatTitle,
    toggleChatPin,
    fetchConversations,
  };
}
