import axiosInstance from "../utils/axios";
import { AiSettings, CreateAiSettingsDto, UpdateAiSettingsDto } from "../types";

export class AiSettingsService {
  /**
   * AI 설정 조회
   */
  static async getSettings(): Promise<AiSettings> {
    const response = await axiosInstance.get<AiSettings>("/ai-settings");
    return response.data;
  }

  /**
   * AI 설정 생성
   */
  static async createSettings(
    settings: CreateAiSettingsDto
  ): Promise<AiSettings> {
    const response = await axiosInstance.post<AiSettings>(
      "/ai-settings",
      settings
    );
    return response.data;
  }

  /**
   * AI 설정 업데이트
   */
  static async updateSettings(
    settings: UpdateAiSettingsDto
  ): Promise<AiSettings> {
    const response = await axiosInstance.put<AiSettings>(
      "/ai-settings",
      settings
    );
    return response.data;
  }

  /**
   * AI 설정 삭제
   */
  static async deleteSettings(): Promise<void> {
    await axiosInstance.delete("/ai-settings");
  }

  /**
   * AI 설정 테스트
   */
  static async testSettings(
    settings: UpdateAiSettingsDto,
    testMessage: string
  ): Promise<{ response: string }> {
    const response = await axiosInstance.post<{ response: string }>(
      "/ai-settings/test",
      {
        settings,
        message: testMessage,
      }
    );
    return response.data;
  }
}
