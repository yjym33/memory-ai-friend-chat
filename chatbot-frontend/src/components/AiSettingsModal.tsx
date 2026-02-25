import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useAiSettings } from "../hooks/useAiSettings";
import { useAiSettingsTest } from "../hooks/useAiSettingsTest";
import SettingsTabs from "./ai-settings/SettingsTabs";
import PersonalitySettings from "./ai-settings/PersonalitySettings";
import MemorySettings from "./ai-settings/MemorySettings";
import ModelSettings from "./ai-settings/ModelSettings";
import ImageSettings from "./ai-settings/ImageSettings";
import TTSSettings from "./ai-settings/TTSSettings";
import STTSettings from "./ai-settings/STTSettings";
import SettingsTestSection from "./ai-settings/SettingsTestSection";
import { LLMProvider, ImageProvider, ImageModel } from "../types";
import { ApiKeyService } from "../services";
import { success as toastSuccess, error as toastError } from "../lib/toast";

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiSettingsModal({
  isOpen,
  onClose,
}: AiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"personality" | "memory" | "model" | "image" | "tts" | "stt">(
    "personality"
  );

  // 모델 설정 상태
  const [modelSettings, setModelSettings] = useState({
    provider: LLMProvider.OPENAI,
    model: "gpt-4o",
    config: {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.5,
      presencePenalty: 0.3,
    },
    apiKeys: {} as { openai?: string; google?: string; anthropic?: string },
  });

  // TTS 설정 상태
  const [ttsSettings, setTtsSettings] = useState({
    ttsEnabled: true,
    ttsAutoPlay: false,
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVolume: 1.0,
    ttsVoice: null as string | null,
  });

  // STT 설정 상태
  const [sttSettings, setSttSettings] = useState({
    sttEnabled: true,
    sttLanguage: "ko-KR",
    sttContinuous: true,
    sttAutoSend: false,
  });

  // 이미지 생성 설정 상태
  const [imageSettings, setImageSettings] = useState({
    provider: ImageProvider.DALLE,
    model: ImageModel.DALLE_3 as string,
    defaultSize: "1024x1024",
    defaultQuality: "standard",
    defaultStyle: "vivid",
  });

  // AI 설정 관리 훅
  const {
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
  } = useAiSettings(isOpen);

  // 모델 설정을 AI 설정에서 불러오기
  useEffect(() => {
    if (settings && isOpen) {
      const defaultConfig = {
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0.5,
        presencePenalty: 0.3,
      };
      
      setModelSettings({
        provider: (settings.llmProvider as LLMProvider) || LLMProvider.OPENAI,
        model: settings.llmModel || "gpt-4o",
        config: {
          ...defaultConfig,
          ...(settings.llmConfig || {}),
        },
        apiKeys: {},
      });

      // 이미지 설정 불러오기
      if (settings.imageProvider || settings.imageModel) {
        setImageSettings({
          provider: (settings.imageProvider as ImageProvider) || ImageProvider.DALLE,
          model: settings.imageModel || ImageModel.DALLE_3,
          defaultSize: settings.imageConfig?.defaultSize || "1024x1024",
          defaultQuality: settings.imageConfig?.defaultQuality || "standard",
          defaultStyle: settings.imageConfig?.defaultStyle || "vivid",
        });
      }
    }
  }, [settings, isOpen]);

  // AI 설정 테스트 훅
  const {
    selectedTestMessage,
    setSelectedTestMessage,
    beforeResponse,
    afterResponse,
    loading: testLoading,
    testSettings,
    compareSettings,
  } = useAiSettingsTest();

  // 저장 및 닫기
  const handleSave = async () => {
    try {
      // 모델 설정을 AI 설정에 반영
      Object.assign(settings, {
        llmProvider: modelSettings.provider,
        llmModel: modelSettings.model,
        llmConfig: modelSettings.config,
        // 이미지 설정 추가
        imageProvider: imageSettings.provider,
        imageModel: imageSettings.model,
        imageConfig: {
          defaultSize: imageSettings.defaultSize,
          defaultQuality: imageSettings.defaultQuality,
          defaultStyle: imageSettings.defaultStyle,
        },
      });

      // 1. AI 설정 저장 (모델 설정 포함)
      const settingsSuccess = await saveSettings();
      if (!settingsSuccess) {
        return; // 설정 저장 실패 시 중단
      }

      // 2. API 키 저장 (백엔드에서 암호화하여 저장)
      const apiKeysToSave: { openai?: string; google?: string; anthropic?: string } = {};
      
      // 입력된 API 키만 저장 (빈 값은 저장하지 않음)
      if (modelSettings.apiKeys.openai && modelSettings.apiKeys.openai.trim() !== "") {
        apiKeysToSave.openai = modelSettings.apiKeys.openai;
      }
      if (modelSettings.apiKeys.google && modelSettings.apiKeys.google.trim() !== "") {
        apiKeysToSave.google = modelSettings.apiKeys.google;
      }
      if (modelSettings.apiKeys.anthropic && modelSettings.apiKeys.anthropic.trim() !== "") {
        apiKeysToSave.anthropic = modelSettings.apiKeys.anthropic;
      }

      // API 키가 하나라도 있으면 저장
      if (Object.keys(apiKeysToSave).length > 0) {
        try {
          await ApiKeyService.updateApiKeys(apiKeysToSave);
          toastSuccess("API 키가 저장되었습니다!");
        } catch (error) {
          console.error("API 키 저장 실패:", error);
          toastError("API 키 저장에 실패했습니다.");
          // API 키 저장 실패해도 설정 저장은 성공했으므로 계속 진행
        }
      }

      onClose();
    } catch (error) {
      console.error("설정 저장 중 오류:", error);
      toastError("설정 저장에 실패했습니다.");
    }
  };

  // 테스트 핸들러들
  const handleTestSettings = () => testSettings(settings);
  const handleCompareSettings = () => compareSettings(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">AI 친구 설정</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {activeTab === "personality" && (
            <>
              <PersonalitySettings
                personalityType={settings.personalityType}
                speechStyle={settings.speechStyle}
                nickname={settings.nickname || ""}
                emojiUsage={settings.emojiUsage}
                empathyLevel={settings.empathyLevel}
                onPersonalityTypeChange={updatePersonalityType}
                onSpeechStyleChange={updateSpeechStyle}
                onNicknameChange={updateNickname}
                onEmojiUsageChange={updateEmojiUsage}
                onEmpathyLevelChange={updateEmpathyLevel}
              />

              <SettingsTestSection
                selectedTestMessage={selectedTestMessage}
                beforeResponse={beforeResponse}
                afterResponse={afterResponse}
                loading={testLoading}
                onTestMessageChange={setSelectedTestMessage}
                onTestSettings={handleTestSettings}
                onCompareSettings={handleCompareSettings}
              />
            </>
          )}

          {activeTab === "memory" && (
            <MemorySettings
              memoryRetentionDays={settings.memoryRetentionDays}
              memoryPriorities={settings.memoryPriorities}
              interests={settings.userProfile.interests}
              onMemoryRetentionDaysChange={updateMemoryRetentionDays}
              onMemoryPriorityChange={updateMemoryPriority}
              onAddInterest={addInterest}
              onRemoveInterest={removeInterest}
            />
          )}

          {activeTab === "model" && (
            <ModelSettings
              provider={modelSettings.provider}
              model={modelSettings.model}
              config={modelSettings.config}
              apiKeys={modelSettings.apiKeys}
              onProviderChange={(provider) =>
                setModelSettings((prev) => ({ ...prev, provider }))
              }
              onModelChange={(model) =>
                setModelSettings((prev) => ({ ...prev, model }))
              }
              onConfigChange={(config) =>
                setModelSettings((prev) => ({
                  ...prev,
                  config: { ...prev.config, ...config },
                }))
              }
              onApiKeyChange={(provider, apiKey) =>
                setModelSettings((prev) => ({
                  ...prev,
                  apiKeys: { ...prev.apiKeys, [provider]: apiKey },
                }))
              }
            />
          )}

          {activeTab === "image" && (
            <ImageSettings
              imageSettings={imageSettings}
              onSettingsChange={setImageSettings}
            />
          )}

          {activeTab === "tts" && (
            <TTSSettings
              settings={ttsSettings}
              onSettingsChange={(newSettings) =>
                setTtsSettings((prev) => ({ ...prev, ...newSettings }))
              }
            />
          )}

          {activeTab === "stt" && (
            <STTSettings
              settings={sttSettings}
              onSettingsChange={(newSettings) =>
                setSttSettings((prev) => ({ ...prev, ...newSettings }))
              }
            />
          )}
        </div>

        {/* 푸터 버튼 */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-800 hover:text-gray-900 transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
          >
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
