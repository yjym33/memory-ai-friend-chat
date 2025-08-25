import { useState, useEffect } from "react";
import { AiSettingsService } from "../services";
import { UpdateAiSettingsDto } from "../types";
import { success as toastSuccess, error as toastError } from "../lib/toast";

/**
 * AI 설정 관리를 위한 커스텀 훅
 */
export function useAiSettings(isOpen: boolean) {
  const [settings, setSettings] = useState<UpdateAiSettingsDto>({
    personalityType: "친근함",
    speechStyle: "반말",
    emojiUsage: 3,
    nickname: "",
    empathyLevel: 3,
    memoryRetentionDays: 90,
    memoryPriorities: { personal: 5, hobby: 4, work: 3, emotion: 5 },
    userProfile: { interests: [], currentGoals: [], importantDates: [] },
    avoidTopics: [],
  });

  const [loading, setLoading] = useState(false);

  // 설정 불러오기
  const fetchSettings = async () => {
    try {
      const data = await AiSettingsService.getSettings();
      const {
        personalityType,
        speechStyle,
        emojiUsage,
        nickname,
        empathyLevel,
        memoryRetentionDays,
        memoryPriorities,
        userProfile,
        avoidTopics,
      } = data;

      setSettings({
        personalityType,
        speechStyle,
        emojiUsage,
        nickname: nickname || "",
        empathyLevel,
        memoryRetentionDays,
        memoryPriorities,
        userProfile,
        avoidTopics,
      });
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    setLoading(true);
    try {
      await AiSettingsService.updateSettings(settings);
      toastSuccess("설정이 저장되었습니다!");
      return true;
    } catch (error) {
      console.error("설정 저장 실패:", error);
      toastError("설정 저장에 실패했습니다.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 설정 업데이트 헬퍼 함수들
  const updatePersonalityType = (personalityType: string) => {
    setSettings((prev) => ({ ...prev, personalityType }));
  };

  const updateSpeechStyle = (speechStyle: string) => {
    setSettings((prev) => ({ ...prev, speechStyle }));
  };

  const updateNickname = (nickname: string) => {
    setSettings((prev) => ({ ...prev, nickname }));
  };

  const updateEmojiUsage = (emojiUsage: number) => {
    setSettings((prev) => ({ ...prev, emojiUsage }));
  };

  const updateEmpathyLevel = (empathyLevel: number) => {
    setSettings((prev) => ({ ...prev, empathyLevel }));
  };

  const updateMemoryRetentionDays = (memoryRetentionDays: number) => {
    setSettings((prev) => ({ ...prev, memoryRetentionDays }));
  };

  const updateMemoryPriority = (key: string, value: number) => {
    setSettings((prev) => ({
      ...prev,
      memoryPriorities: {
        ...prev.memoryPriorities,
        [key]: value,
      },
    }));
  };

  const addInterest = (interest: string) => {
    setSettings((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        interests: [...prev.userProfile.interests, interest],
      },
    }));
  };

  const removeInterest = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        interests: prev.userProfile.interests.filter((_, i) => i !== index),
      },
    }));
  };

  // 모달이 열릴 때 설정 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  return {
    settings,
    loading,
    saveSettings,
    updatePersonalityType,
    updateSpeechStyle,
    updateNickname,
    updateEmojiUsage,
    updateEmpathyLevel,
    updateMemoryRetentionDays,
    updateMemoryPriority,
    addInterest,
    removeInterest,
  };
}
