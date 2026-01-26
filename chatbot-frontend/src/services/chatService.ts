/**
 * ChatService
 *
 * 채팅 관련 API 요청을 처리하는 서비스 클래스
 * 대화 CRUD, 메시지 전송, 스트리밍 등 채팅 기능 제공
 *
 * @performance
 * - 조기 반환 패턴 적용 (js-early-exit)
 * - 동적 import로 번들 최적화 (bundle-dynamic-imports)
 * - Promise 병렬 처리 가능한 구조 (async-parallel)
 */
import { Conversation, Message } from "../types";
import { apiClient } from "./apiClient";

/** 메시지 소스 정보 타입 */
interface MessageSource {
  title: string;
  documentId: string;
  type?: string;
  relevance: number;
  snippet?: string;
}

/** 스트리밍 이미지 메타데이터 */
interface ImageMetadata {
  model: string;
  provider: string;
  prompt?: string;
}

/** 스트리밍 이미지 데이터 */
interface StreamImageData {
  images: string[];
  imageMetadata?: ImageMetadata;
}

/** API 토큰 캐시 - 동적 import 비용 절감 */
let cachedGetToken: (() => string | null) | null = null;

/**
 * 인증 토큰 조회 함수 (캐시됨)
 * 동적 import의 비용을 캐싱으로 최소화 (js-cache-function-results)
 */
const getAuthToken = async (): Promise<string | null> => {
  if (!cachedGetToken) {
    const { useAuthStore } = await import("../store/authStore");
    cachedGetToken = () => useAuthStore.getState().token;
  }
  return cachedGetToken();
};

/**
 * 채팅 서비스 클래스
 * 모든 메서드는 static으로 선언되어 인스턴스 생성 없이 사용 가능
 */
export class ChatService {
  /**
   * 모든 대화 목록 조회
   *
   * @returns 대화 목록 배열
   */
  static async getConversations(): Promise<Conversation[]> {
    return apiClient.get<Conversation[]>("/chat/conversations");
  }

  /**
   * 특정 대화 조회
   *
   * @param conversationId - 조회할 대화 ID
   * @returns 대화 상세 정보
   */
  static async getConversation(conversationId: number): Promise<Conversation> {
    return apiClient.get<Conversation>(`/chat/conversations/${conversationId}`);
  }

  /**
   * 새 대화 생성
   *
   * @returns 생성된 대화 정보
   */
  static async createConversation(): Promise<Conversation> {
    return apiClient.post<Conversation>("/chat/conversations");
  }

  /**
   * 메시지 전송
   *
   * @param conversationId - 대화 ID
   * @param message - 전송할 메시지 내용
   * @param file - 첨부 파일 (선택)
   * @returns AI 응답 메시지
   */
  static async sendMessage(
    conversationId: number,
    message: string,
    file?: File | null
  ): Promise<Message> {
    const response = await apiClient.post<{
      role: "assistant";
      content: string;
      sources?: MessageSource[];
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
   *
   * @param conversationId - 대화 ID
   * @param title - 새 제목
   * @returns 수정된 대화 정보
   */
  static async updateConversationTitle(
    conversationId: number,
    title: string
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/title`,
      { title }
    );
  }

  /**
   * 대화 고정/해제 토글
   *
   * @param conversationId - 대화 ID
   * @param pinned - 고정 여부
   * @returns 수정된 대화 정보
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
   * 대화 보관/해제 토글
   *
   * @param conversationId - 대화 ID
   * @param archived - 보관 여부
   * @returns 수정된 대화 정보
   */
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
   *
   * @param conversationId - 삭제할 대화 ID
   */
  static async deleteConversation(conversationId: number): Promise<void> {
    await apiClient.delete<void>(`/chat/conversations/${conversationId}`);
  }

  /**
   * 대화 테마 조회
   *
   * @param conversationId - 대화 ID
   * @returns 테마 정보
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
   *
   * @param conversationId - 대화 ID
   * @param theme - 테마 설정 객체
   * @param themeName - 테마 이름
   * @returns 수정된 대화 정보
   */
  static async updateConversationTheme(
    conversationId: number,
    theme: Record<string, unknown>,
    themeName: string
  ): Promise<Conversation> {
    return apiClient.put<Conversation>(
      `/chat/conversations/${conversationId}/theme`,
      { theme, themeName }
    );
  }

  /**
   * 기업 모드 메시지 전송 (문서 검색 기반)
   *
   * @param conversationId - 대화 ID
   * @param query - 검색 쿼리
   * @returns AI 응답 메시지 (소스 정보 포함)
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
        documentId?: string;
        id?: string;
        snippet?: string;
      }>;
    }>(`/chat/completion/${conversationId}`, {
      message: query,
      mode: "business",
    });

    // 소스 정보 매핑 및 정규화
    const sources = (response.sources || []).map((source) => ({
      title: source.title || "제목 없음",
      documentId: source.documentId || source.id || "unknown",
      type: source.type,
      relevance: source.relevance || 0,
      snippet: source.snippet,
    }));

    return {
      role: "assistant",
      content: response.response,
      timestamp: new Date().toISOString(),
      sources,
    };
  }

  /**
   * 문서 검색
   *
   * @param query - 검색 쿼리
   * @param options - 검색 옵션
   * @returns 검색 결과 배열
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
   *
   * @param mode - 전환할 모드 ("personal" | "business")
   * @returns 전환 결과
   */
  static async switchChatMode(
    mode: "personal" | "business"
  ): Promise<{ mode: string }> {
    return apiClient.post("/ai-settings/switch-mode", { mode });
  }

  /**
   * 사용 가능한 채팅 모드 조회
   *
   * @returns 사용 가능한 모드 목록
   */
  static async getAvailableModes(): Promise<{ availableModes: string[] }> {
    return apiClient.get("/ai-settings/available-modes");
  }

  /**
   * 스트리밍 방식으로 메시지 전송 (이미지 생성 지원)
   *
   * Server-Sent Events (SSE)를 사용하여 실시간 응답 스트리밍
   *
   * @param conversationId - 대화 ID
   * @param message - 전송할 메시지
   * @param onToken - 토큰 수신 콜백
   * @param onSources - 소스 정보 수신 콜백 (선택)
   * @param onComplete - 완료 콜백 (선택)
   * @param onError - 에러 콜백 (선택)
   * @param onImages - 이미지 생성 콜백 (선택)
   */
  static async sendMessageStream(
    conversationId: number,
    message: string,
    onToken: (token: string) => void,
    onSources?: (sources: MessageSource[]) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    onImages?: (data: StreamImageData) => void
  ): Promise<void> {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // 캐시된 토큰 조회 함수 사용 (bundle-dynamic-imports)
      const token = await getAuthToken();

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

      // 조기 반환: HTTP 에러 체크 (js-early-exit)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();

      // 조기 반환: 리더 유효성 체크 (js-early-exit)
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      // 스트림 처리 루프
      while (true) {
        const { done, value } = await reader.read();

        // 조기 반환: 스트림 종료 (js-early-exit)
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        // SSE 라인 처리
        for (const line of lines) {
          // 조기 반환: 데이터 라인이 아닌 경우 스킵
          if (!line.startsWith("data: ")) {
            continue;
          }

          try {
            const data = JSON.parse(line.slice(6));

            // 메시지 타입별 처리
            switch (data.type) {
              case "token":
                onToken(data.content);
                break;

              case "sources":
                onSources?.(data.content);
                break;

              case "images":
                onImages?.(data.content);
                break;

              case "done":
                onComplete?.();
                return;

              case "error":
                throw new Error(data.content);
            }
          } catch (parseError) {
            console.error("SSE 파싱 오류:", parseError);
          }
        }
      }

      // 스트림 정상 완료
      onComplete?.();
    } catch (error) {
      console.error("스트리밍 오류:", error);
      onError?.(error instanceof Error ? error : new Error("알 수 없는 오류"));
    }
  }
}
