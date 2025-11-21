import { apiClient } from "./apiClient";
import { LLMProvider } from "../types";

/**
 * API 키 관리 서비스
 * 사용자의 LLM API 키를 저장하고 관리합니다.
 */
export class ApiKeyService {
  /**
   * 단일 Provider의 API 키를 업데이트합니다.
   * @param provider - LLM Provider
   * @param apiKey - API 키
   */
  static async updateApiKey(
    provider: LLMProvider,
    apiKey: string
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>("/auth/api-keys", {
      provider,
      apiKey,
    });
  }

  /**
   * 모든 Provider의 API 키를 한 번에 업데이트합니다.
   * @param apiKeys - API 키 객체 (provider별 키)
   */
  static async updateApiKeys(apiKeys: {
    openai?: string;
    google?: string;
    anthropic?: string;
  }): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>("/auth/api-keys/all", {
      apiKeys,
    });
  }
}

