import React from "react";

interface SettingsTabsProps {
  activeTab: "personality" | "memory" | "model" | "image" | "tts" | "stt";
  onTabChange: (tab: "personality" | "memory" | "model" | "image" | "tts" | "stt") => void;
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
        🎭 성격
      </button>
      <button
        onClick={() => onTabChange("memory")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "memory"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🧠 기억
      </button>
      <button
        onClick={() => onTabChange("model")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "model"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🤖 LLM
      </button>
      <button
        onClick={() => onTabChange("image")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "image"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🎨 이미지
      </button>
      <button
        onClick={() => onTabChange("tts")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "tts"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🔊 TTS
      </button>
      <button
        onClick={() => onTabChange("stt")}
        className={`flex-1 py-3 px-4 text-center transition whitespace-nowrap ${
          activeTab === "stt"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🎙️ STT
      </button>
    </div>
  );
}
