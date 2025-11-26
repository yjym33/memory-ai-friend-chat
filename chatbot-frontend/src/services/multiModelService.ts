import { apiClient } from "./apiClient";
import {
  LLMProvider,
  MultiModelResponse,
  AvailableProvidersResponse,
  ConsensusResponse,
  SelectResponseRequest,
  MultiModelStreamChunk,
  MultiModelCompleteEvent,
  MultiModelErrorEvent,
} from "../types";

const API_BASE = "/chat";

/**
 * Multi-Model Orchestrator 서비스
 * 여러 AI 모델을 동시에 호출하여 복수의 응답을 받습니다.
 */
export const multiModelService = {
  /**
   * 사용 가능한 Provider 목록을 조회합니다.
   */
  getAvailableProviders: async (): Promise<AvailableProvidersResponse> => {
    const response = await apiClient.get<AvailableProvidersResponse>(
      `${API_BASE}/multi-model/providers`
    );
    return response;
  },

  /**
   * 여러 AI 모델을 동시에 호출하여 복수의 응답을 받습니다.
   * @param conversationId - 대화 ID
   * @param message - 사용자 메시지
   * @param providers - 사용할 Provider 목록
   */
  generateMultiModelResponses: async (
    conversationId: number,
    message: string,
    providers: LLMProvider[]
  ): Promise<MultiModelResponse> => {
    const response = await apiClient.post<MultiModelResponse>(
      `${API_BASE}/completion/${conversationId}/multi`,
      {
        message,
        providers,
      }
    );
    return response;
  },

  /**
   * 여러 AI 모델의 응답을 스트리밍 방식으로 받습니다.
   */
  generateMultiModelStream: async (
    conversationId: number,
    message: string,
    providers: LLMProvider[],
    callbacks: {
      onChunk: (data: MultiModelStreamChunk) => void;
      onComplete: (data: MultiModelCompleteEvent) => void;
      onError: (data: MultiModelErrorEvent) => void;
      onDone: () => void;
    }
  ): Promise<void> => {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${API_BASE}/completion/${conversationId}/multi/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, providers }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        callbacks.onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // SSE 이벤트 파싱
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          const eventType = line.substring(7).trim();

          // 다음 라인에서 데이터 가져오기
          const dataLineIndex = lines.indexOf(line) + 1;
          if (dataLineIndex < lines.length) {
            const dataLine = lines[dataLineIndex];
            if (dataLine.startsWith("data: ")) {
              const dataStr = dataLine.substring(6);
              try {
                const data = JSON.parse(dataStr);

                switch (eventType) {
                  case "multi_token":
                    callbacks.onChunk(data as MultiModelStreamChunk);
                    break;
                  case "multi_complete":
                    callbacks.onComplete(data as MultiModelCompleteEvent);
                    break;
                  case "multi_error":
                    callbacks.onError(data as MultiModelErrorEvent);
                    break;
                  case "done":
                    callbacks.onDone();
                    break;
                }
              } catch {
                // JSON 파싱 실패 시 무시
              }
            }
          }
        }
      }
    }
  },

  /**
   * 여러 AI 모델의 응답을 종합하여 합의 기반 응답을 생성합니다.
   */
  generateConsensusResponse: async (
    conversationId: number,
    message: string,
    providers?: LLMProvider[]
  ): Promise<ConsensusResponse> => {
    const response = await apiClient.post<ConsensusResponse>(
      `${API_BASE}/completion/${conversationId}/consensus`,
      {
        message,
        providers,
      }
    );
    return response;
  },

  /**
   * 선택된 응답을 대화에 저장합니다.
   */
  selectResponse: async (
    conversationId: number,
    request: SelectResponseRequest
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const response = await apiClient.post<{
      success: boolean;
      message?: string;
      error?: string;
    }>(`${API_BASE}/completion/${conversationId}/multi/select`, request);
    return response;
  },
};

