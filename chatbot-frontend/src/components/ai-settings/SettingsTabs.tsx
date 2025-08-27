import React from "react";

interface SettingsTabsProps {
  activeTab: "personality" | "memory";
  onTabChange: (tab: "personality" | "memory") => void;
}

export default function SettingsTabs({
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="flex border-b">
      <button
        onClick={() => onTabChange("personality")}
        className={`flex-1 py-3 px-4 text-center transition ${
          activeTab === "personality"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🎭 성격 설정
      </button>
      <button
        onClick={() => onTabChange("memory")}
        className={`flex-1 py-3 px-4 text-center transition ${
          activeTab === "memory"
            ? "bg-purple-50 text-purple-600 border-b-2 border-purple-500"
            : "text-gray-800 hover:bg-gray-50"
        }`}
      >
        🧠 기억 관리
      </button>
    </div>
  );
}
