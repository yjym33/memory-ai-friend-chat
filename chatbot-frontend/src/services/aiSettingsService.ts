import { AiSettings, CreateAiSettingsDto, UpdateAiSettingsDto } from "../types";
import { apiClient } from "./apiClient";

export class AiSettingsService {
  /**
   * AI 설정 조회
   */
  static async getSettings(): Promise<AiSettings> {
    return apiClient.get<AiSettings>("/ai-settings");
  }

  /**
   * AI 설정 생성
   */
  static async createSettings(
    settings: CreateAiSettingsDto
  ): Promise<AiSettings> {
    return apiClient.post<AiSettings>("/ai-settings", settings);
  }

  /**
   * AI 설정 업데이트
   */
  static async updateSettings(
    settings: UpdateAiSettingsDto
  ): Promise<AiSettings> {
    return apiClient.put<AiSettings>("/ai-settings", settings);
  }

  /**
   * AI 설정 삭제
   */
  static async deleteSettings(): Promise<void> {
    await apiClient.delete<void>("/ai-settings");
  }

  /**
   * AI 설정 테스트
   */
  static async testSettings(
    settings: UpdateAiSettingsDto,
    testMessage: string
  ): Promise<{ response: string }> {
    return apiClient.post<{ response: string }>("/ai-settings/test", {
      settings,
      message: testMessage,
    });
  }
}
