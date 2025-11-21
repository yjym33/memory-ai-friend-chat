import { useState, useEffect } from "react";
import { ChatService } from "../services";
import { Conversation, UploadedFile } from "../types";
import { ChatMode } from "../components/ChatModeSwitch";
import { useErrorHandler } from "./useErrorHandler";
import {
  addMessageToConversation,
  appendTokenToLastAssistantMessage,
  addSourcesToLastAssistantMessage,
  createEmptyAssistantMessage,
  createUserMessage,
} from "../utils/conversationHelpers";
import { ERROR_MESSAGES } from "../constants/messages";

/**
 * 채팅 관리를 위한 커스텀 훅
 */
export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { handleError, createApiError } = useErrorHandler();

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
    } catch {
      const apiError = createApiError(
        ERROR_MESSAGES.FETCH_CONVERSATIONS_FAILED,
        "/conversations"
      );
      handleError(apiError, { showToast: true });
    }
  };

  // 메시지 전송 (스트리밍 방식)
  const sendMessage = async (
    message: string,
    file?: UploadedFile,
    chatMode: ChatMode = ChatMode.PERSONAL
  ) => {
    // 메시지가 없으면 전송하지 않음
    if (!message.trim() && !file) return;

    setLoading(true);
    try {
      // activeChatId가 없으면 새 대화방 자동 생성
      let currentChatId = activeChatId;
      if (!currentChatId) {
        const newChat = await ChatService.createConversation();
        setConversations((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        currentChatId = newChat.id;
      }

      // 파일이 첨부된 경우 메시지 내용 구성
      let messageContent = message;
      if (file) {
        messageContent = `${message}\n\n📎 첨부파일: ${file.originalName}`;
      }

      const userMessage = createUserMessage(messageContent);

      // UI에 사용자 메시지 즉시 반영
      setConversations((prev) =>
        addMessageToConversation(prev, currentChatId!, userMessage)
      );

      // AI 응답을 위한 빈 메시지 생성
      const assistantMessage = createEmptyAssistantMessage();

      // UI에 빈 assistant 메시지 추가 (스트리밍으로 채워질 예정)
      setConversations((prev) =>
        addMessageToConversation(prev, currentChatId!, assistantMessage)
      );

      // 메시지 전송 (스트리밍 방식)
      await ChatService.sendMessageStream(
        currentChatId!,
        message,
        // 각 토큰을 받을 때마다 UI 업데이트
        (token: string) => {
          setConversations((prev) =>
            appendTokenToLastAssistantMessage(prev, currentChatId!, token)
          );
        },
        // 출처 정보를 받을 때
        (sources) => {
          setConversations((prev) =>
            addSourcesToLastAssistantMessage(prev, currentChatId!, sources)
          );
        },
        // 스트리밍 완료 시
        async () => {
          // 스트리밍이 완료되었으므로 별도 처리 불필요
          // 백엔드에서 이미 대화를 저장했음
          console.log("스트리밍 완료");
        },
        // 에러 발생 시
        (error) => {
          const apiError = createApiError(
            error.message || ERROR_MESSAGES.SEND_MESSAGE_FAILED,
            "/chat/completion"
          );
          handleError(apiError, { showToast: true });
        }
      );
    } catch (error) {
      console.error('메시지 전송 오류:', error);
      const apiError = createApiError(
        error instanceof Error && error.message
          ? error.message
          : ERROR_MESSAGES.SEND_MESSAGE_FAILED,
        "/chat/completion"
      );
      handleError(apiError, { showToast: true });
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
    } catch {
      const apiError = createApiError(
        ERROR_MESSAGES.CREATE_CONVERSATION_FAILED,
        "/conversations"
      );
      handleError(apiError, { showToast: true });
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
    } catch {
      const apiError = createApiError(
        ERROR_MESSAGES.DELETE_CONVERSATION_FAILED,
        `/conversations/${chatId}`
      );
      handleError(apiError, { showToast: true });
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
    } catch {
      const apiError = createApiError(
        "대화방 이름 변경에 실패했습니다.",
        `/conversations/${chatId}`
      );
      handleError(apiError, { showToast: true });
    }
  };

  // 대화방 고정/해제
  const toggleChatPin = async (chatId: number) => {
    try {
      // 현재 대화의 pinned 상태를 찾기
      const currentConversation = conversations.find((c) => c.id === chatId);
      if (!currentConversation) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
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
    } catch {
      const apiError = createApiError(
        "대화방 고정/해제에 실패했습니다.",
        `/conversations/${chatId}/pin`
      );
      handleError(apiError, { showToast: true });
    }
  };

  // 대화방 보관/해제
  const toggleChatArchive = async (chatId: number) => {
    try {
      // 현재 대화의 archived 상태를 찾기
      const currentConversation = conversations.find((c) => c.id === chatId);
      if (!currentConversation) {
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }

      // 현재 상태의 반대값으로 토글
      const newArchivedState = !currentConversation.isArchived;

      const updatedConversation = await ChatService.toggleConversationArchive(
        chatId,
        newArchivedState
      );

      setConversations((prev) =>
        prev.map((c) => (c.id === chatId ? updatedConversation : c))
      );
    } catch {
      const apiError = createApiError(
        "대화방 보관/해제에 실패했습니다.",
        `/conversations/${chatId}/archive`
      );
      handleError(apiError, { showToast: true });
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
    toggleChatArchive,
    fetchConversations,
  };
}
