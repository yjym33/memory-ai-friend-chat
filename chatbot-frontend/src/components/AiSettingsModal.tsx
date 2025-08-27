import React, { useState } from "react";
import { X } from "lucide-react";
import { useAiSettings } from "../hooks/useAiSettings";
import { useAiSettingsTest } from "../hooks/useAiSettingsTest";
import SettingsTabs from "./ai-settings/SettingsTabs";
import PersonalitySettings from "./ai-settings/PersonalitySettings";
import MemorySettings from "./ai-settings/MemorySettings";
import SettingsTestSection from "./ai-settings/SettingsTestSection";

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiSettingsModal({
  isOpen,
  onClose,
}: AiSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"personality" | "memory">(
    "personality"
  );

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
    const success = await saveSettings();
    if (success) {
      onClose();
    }
  };

  // 테스트 핸들러들
  const handleTestSettings = () => testSettings(settings);
  const handleCompareSettings = () => compareSettings(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
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
