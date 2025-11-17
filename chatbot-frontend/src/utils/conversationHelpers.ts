import { Conversation, Message } from "../types";

/**
 * 대화 상태 업데이트 헬퍼 함수
 */

/**
 * 대화 목록에서 특정 대화의 메시지를 업데이트합니다.
 * @param conversations - 현재 대화 목록
 * @param conversationId - 업데이트할 대화 ID
 * @param updater - 메시지 배열을 업데이트하는 함수
 * @returns 업데이트된 대화 목록
 */
export function updateConversationMessages(
  conversations: Conversation[],
  conversationId: number,
  updater: (messages: Message[]) => Message[]
): Conversation[] {
  return conversations.map((conv) => {
    if (conv.id === conversationId) {
      const updatedMessages = updater([...conv.messages]);
      return { ...conv, messages: updatedMessages };
    }
    return conv;
  });
}

/**
 * 대화에 새 메시지를 추가합니다.
 * @param conversations - 현재 대화 목록
 * @param conversationId - 대화 ID
 * @param message - 추가할 메시지
 * @returns 업데이트된 대화 목록
 */
export function addMessageToConversation(
  conversations: Conversation[],
  conversationId: number,
  message: Message
): Conversation[] {
  return updateConversationMessages(conversations, conversationId, (messages) => [
    ...messages,
    message,
  ]);
}

/**
 * 대화의 마지막 메시지를 업데이트합니다.
 * @param conversations - 현재 대화 목록
 * @param conversationId - 대화 ID
 * @param updater - 마지막 메시지를 업데이트하는 함수
 * @returns 업데이트된 대화 목록
 */
export function updateLastMessage(
  conversations: Conversation[],
  conversationId: number,
  updater: (message: Message) => Message
): Conversation[] {
  return updateConversationMessages(conversations, conversationId, (messages) => {
    if (messages.length === 0) return messages;
    
    const lastIndex = messages.length - 1;
    const updatedMessage = updater({ ...messages[lastIndex] });
    
    return [
      ...messages.slice(0, lastIndex),
      updatedMessage,
    ];
  });
}

/**
 * 대화의 마지막 assistant 메시지에 토큰을 추가합니다.
 * @param conversations - 현재 대화 목록
 * @param conversationId - 대화 ID
 * @param token - 추가할 토큰
 * @returns 업데이트된 대화 목록
 */
export function appendTokenToLastAssistantMessage(
  conversations: Conversation[],
  conversationId: number,
  token: string
): Conversation[] {
  return updateLastMessage(conversations, conversationId, (message) => {
    if (message.role !== "assistant") return message;
    return {
      ...message,
      content: message.content + token,
    };
  });
}

/**
 * 대화의 마지막 assistant 메시지에 출처를 추가합니다.
 * @param conversations - 현재 대화 목록
 * @param conversationId - 대화 ID
 * @param sources - 출처 정보
 * @returns 업데이트된 대화 목록
 */
export function addSourcesToLastAssistantMessage(
  conversations: Conversation[],
  conversationId: number,
  sources: Array<{
    title: string;
    documentId: string;
    type?: string;
    relevance: number;
    snippet?: string;
  }>
): Conversation[] {
  return updateLastMessage(conversations, conversationId, (message) => {
    if (message.role !== "assistant") return message;
    return {
      ...message,
      sources,
    };
  });
}

/**
 * 빈 assistant 메시지를 생성합니다.
 * @returns 빈 assistant 메시지
 */
export function createEmptyAssistantMessage(): Message {
  return {
    role: "assistant",
    content: "",
    timestamp: new Date().toISOString(),
  };
}

/**
 * 사용자 메시지를 생성합니다.
 * @param content - 메시지 내용
 * @returns 사용자 메시지
 */
export function createUserMessage(content: string): Message {
  return {
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  };
}

