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
    file?: File | null
  ): Promise<Message> {
    const response = await apiClient.post<{
      role: "assistant";
      content: string;
      sources?: Array<{
        title: string;
        documentId: string;
        type?: string;
        relevance: number;
        snippet?: string;
      }>;
    }>(`/chat/completion/${conversationId}`, {
      message,
      file,
    });

    return {
      role: response.role,
      content: response.content,
      timestamp: new Date().toISOString(),
      sources: response.sources || [],
    };
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

  // 대화 보관/해제
  static async toggleConversationArchive(
    conversationId: number,
    archived: boolean
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/archive`,
      { archived }
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
      sources: (response.sources || []).map(
        (source: Record<string, unknown>) => ({
          title: (source.title as string) || "제목 없음",
          documentId:
            (source.documentId as string) || (source.id as string) || "unknown",
          type: source.type as string | undefined,
          relevance: (source.relevance as number) || 0,
          snippet: source.snippet as string | undefined,
        })
      ), // 출처 정보 추가
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
  ): Promise<unknown[]> {
    return apiClient.post<unknown[]>("/documents/search", {
      query,
      ...options,
    });
  }

  /**
   * AI 설정 모드 전환
   */
  static async switchChatMode(
    mode: "personal" | "business"
  ): Promise<{ mode: string }> {
    return apiClient.post("/ai-settings/switch-mode", { mode });
  }

  /**
   * 사용 가능한 채팅 모드 조회
   */
  static async getAvailableModes(): Promise<{ availableModes: string[] }> {
    return apiClient.get("/ai-settings/available-modes");
  }

  /**
   * 스트리밍 방식으로 메시지 전송 (이미지 생성 지원)
   */
  static async sendMessageStream(
    conversationId: number,
    message: string,
    onToken: (token: string) => void,
    onSources?: (
      sources: Array<{
        title: string;
        documentId: string;
        type?: string;
        relevance: number;
        snippet?: string;
      }>
    ) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    onImages?: (data: {
      images: string[];
      imageMetadata?: {
        model: string;
        provider: string;
        prompt?: string;
      };
    }) => void
  ): Promise<void> {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = (await import("../store/authStore")).useAuthStore.getState()
        .token;

      const response = await fetch(
        `${API_URL}/chat/completion/${conversationId}/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "token") {
                onToken(data.content);
              } else if (data.type === "sources" && onSources) {
                onSources(data.content);
              } else if (data.type === "images" && onImages) {
                // 이미지 생성 이벤트 처리
                onImages(data.content);
              } else if (data.type === "done") {
                if (onComplete) onComplete();
                return;
              } else if (data.type === "error") {
                throw new Error(data.content);
              }
            } catch (e) {
              console.error("SSE 파싱 오류:", e);
            }
          }
        }
      }

      if (onComplete) onComplete();
    } catch (error) {
      console.error("스트리밍 오류:", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error("알 수 없는 오류"));
      }
    }
  }
}
