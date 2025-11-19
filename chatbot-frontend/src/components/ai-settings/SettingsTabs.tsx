import React from "react";

interface SettingsTabsProps {
  activeTab: "personality" | "memory" | "tts" | "stt";
  onTabChange: (tab: "personality" | "memory" | "tts" | "stt") => void;
}

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="flex border-b overflow-x-auto">
      <button
        onClick={() => onTabChange("personality")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "personality"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🎭 성격 설정
      </button>
      <button
        onClick={() => onTabChange("memory")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "memory"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🧠 기억 관리
      </button>
      <button
        onClick={() => onTabChange("tts")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "tts"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🔊 음성 출력
      </button>
      <button
        onClick={() => onTabChange("stt")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "stt"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🎙️ 음성 입력
      </button>
    </div>
  );
}
