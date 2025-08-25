import { useState } from "react";
import { AiSettingsService } from "../services";
import { UpdateAiSettingsDto } from "../types";
import { success as toastSuccess, error as toastError } from "../lib/toast";

/**
 * AI 설정 테스트를 위한 커스텀 훅
 */
export function useAiSettingsTest() {
  const [selectedTestMessage, setSelectedTestMessage] = useState("");
  const [beforeResponse, setBeforeResponse] = useState("");
  const [afterResponse, setAfterResponse] = useState("");
  const [loading, setLoading] = useState(false);

  // 설정 테스트
  const testSettings = async (settings: UpdateAiSettingsDto) => {
    setLoading(true);
    try {
      const testMessage = selectedTestMessage || "안녕! 기분이 어떤지 궁금해~";
      const response = await AiSettingsService.testSettings(
        settings,
        testMessage
      );

      setAfterResponse(response.response);
      toastSuccess("테스트가 완료되었습니다! 결과를 확인해보세요.");
    } catch (error) {
      toastError("테스트 실패: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 설정 변경 전후 비교
  const compareSettings = async (settings: UpdateAiSettingsDto) => {
    const testMessage = "안녕! 오늘 하루 어땠어?";
    setLoading(true);

    try {
      // 현재 설정으로 테스트
      const currentSettings = await AiSettingsService.getSettings();

      // AiSettings를 UpdateAiSettingsDto로 변환
      const settingsForTest: UpdateAiSettingsDto = {
        personalityType: currentSettings.personalityType,
        speechStyle: currentSettings.speechStyle,
        emojiUsage: currentSettings.emojiUsage,
        nickname: currentSettings.nickname || undefined,
        empathyLevel: currentSettings.empathyLevel,
        memoryRetentionDays: currentSettings.memoryRetentionDays,
        memoryPriorities: currentSettings.memoryPriorities,
        userProfile: currentSettings.userProfile,
        avoidTopics: currentSettings.avoidTopics,
      };

      const beforeResponse = await AiSettingsService.testSettings(
        settingsForTest,
        testMessage
      );
      setBeforeResponse(beforeResponse.response);

      // 새 설정으로 테스트
      const afterResponse = await AiSettingsService.testSettings(
        settings,
        testMessage
      );
      setAfterResponse(afterResponse.response);

      toastSuccess("변경 전후 비교가 완료되었습니다!");
    } catch (error) {
      console.error("비교 테스트 실패:", error);
      toastError("비교 테스트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 응답 초기화
  const clearResponses = () => {
    setBeforeResponse("");
    setAfterResponse("");
  };

  return {
    selectedTestMessage,
    setSelectedTestMessage,
    beforeResponse,
    afterResponse,
    loading,
    testSettings,
    compareSettings,
    clearResponses,
  };
}
