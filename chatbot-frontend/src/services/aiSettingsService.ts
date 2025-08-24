import { AiSettings, CreateAiSettingsDto, UpdateAiSettingsDto } from "../types";
import { BaseService } from "./baseService";

export class AiSettingsService extends BaseService {
  /**
   * AI 설정 조회
   */
  static async getSettings(): Promise<AiSettings> {
    return BaseService.get<AiSettings>("/ai-settings");
  }

  /**
   * AI 설정 생성
   */
  static async createSettings(
    settings: CreateAiSettingsDto
  ): Promise<AiSettings> {
    return BaseService.post<AiSettings>("/ai-settings", settings);
  }

  /**
   * AI 설정 업데이트
   */
  static async updateSettings(
    settings: UpdateAiSettingsDto
  ): Promise<AiSettings> {
    return BaseService.put<AiSettings>("/ai-settings", settings);
  }

  /**
   * AI 설정 삭제
   */
  static async deleteSettings(): Promise<void> {
    await BaseService.delete<void>("/ai-settings");
  }

  /**
   * AI 설정 테스트
   */
  static async testSettings(
    settings: UpdateAiSettingsDto,
    testMessage: string
  ): Promise<{ response: string }> {
    return BaseService.post<{ response: string }>("/ai-settings/test", {
      settings,
      message: testMessage,
    });
  }
}
