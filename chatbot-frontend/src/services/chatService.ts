import { Conversation, Message } from "../types";
import { apiClient } from "./apiClient";

export class ChatService {
  /**
   * 모든 대화 목록 조회
   */
  static async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/chat/conversations");
  }

  /**
   * 특정 대화 조회
   */
  static async getConversation(conversationId: number): Promise<Conversation> {
    return apiClient.get<Conversation>(`/chat/conversations/${conversationId}`);
  }

  /**
   * 새 대화 생성
   */
  static async createConversation(): Promise<Conversation> {
    return apiClient.post<Conversation>("/chat/conversations");
  }

  /**
   * 메시지 전송
   */
  static async sendMessage(
    conversationId: number,
    message: string,
    file?: any
  ): Promise<Message> {
    return apiClient.post<Message>(`/chat/completion/${conversationId}`, {
      message,
      file,
    });
  }

  /**
   * 대화 제목 수정
   */
  static async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/title`,
      {
        title,
      }
    );
  }

  /**
   * 대화 고정/해제
   */
  static async toggleConversationPin(
    conversationId: number,
    pinned: boolean
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/pin`,
      { pinned }
    );
  }

  /**
   * 대화 삭제
   */
  static async deleteConversation(conversationId: number): Promise<void> {
    await apiClient.delete<void>(`/chat/conversations/${conversationId}`);
  }

  /**
   * 대화 테마 조회
   */
  static async getConversationTheme(conversationId: number): Promise<{
    theme: Record<string, unknown>;
    themeName: string;
  }> {
    return apiClient.get<{
      theme: Record<string, unknown>;
      themeName: string;
    }>(`/chat/conversations/${conversationId}/theme`);
  }

  /**
   * 대화 테마 업데이트
   */
  static async updateConversationTheme(
    conversationId: number,
    theme: Record<string, unknown>,
    themeName: string
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/theme`,
      {
        theme,
        themeName,
      }
    );
  }

  /**
   * 기업 모드 메시지 전송 (문서 검색 기반)
   */
  static async sendBusinessQuery(
    conversationId: number,
    query: string
  ): Promise<Message> {
    const response = await apiClient.post<{
      response: string;
      sources?: Array<{
        title: string;
        type: string;
        relevance: number;
      }>;
    }>(`/chat/completion/${conversationId}`, {
      message: query,
      mode: "business",
    });

    return {
      role: "assistant",
      content: response.response,
      timestamp: new Date().toISOString(),
      sources: (response.sources || []).map((source: any) => ({
        ...source,
        documentId: source.documentId || source.id || "unknown",
      })), // 출처 정보 추가
    };
  }

  /**
   * 문서 검색
   */
  static async searchDocuments(
    query: string,
    options?: {
      types?: string[];
      limit?: number;
      threshold?: number;
    }
  ): Promise<any[]> {
    return apiClient.post<any[]>("/documents/search", {
      query,
      ...options,
    });
  }

  /**
   * AI 설정 모드 전환
   */
  static async switchChatMode(mode: "personal" | "business"): Promise<any> {
    return apiClient.post("/ai-settings/switch-mode", { mode });
  }

  /**
   * 사용 가능한 채팅 모드 조회
   */
  static async getAvailableModes(): Promise<{ availableModes: string[] }> {
    return apiClient.get("/ai-settings/available-modes");
  }
}
