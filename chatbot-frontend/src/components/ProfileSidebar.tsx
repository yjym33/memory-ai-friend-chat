import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import AiSettingsModal from "./AiSettingsModal";
import AgentStatusModal from "./AgentStatusModal";
import axiosInstance from "../utils/axios";

export default function ProfileSidebar() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAgentStatusOpen, setIsAgentStatusOpen] = useState(false);
  const [currentSettings, setCurrentSettings] = useState({
    personalityType: "친근함",
    speechStyle: "반말",
  });

  // 현재 설정 가져오기
  useEffect(() => {
    fetchCurrentSettings();
  }, []);

  const fetchCurrentSettings = async () => {
    try {
      const response = await axiosInstance.get("/ai-settings");
      setCurrentSettings({
        personalityType: response.data.personalityType,
        speechStyle: response.data.speechStyle,
      });
    } catch (error) {
      console.error("설정 불러오기 실패:", error);
    }
  };

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    fetchCurrentSettings(); // 설정 변경 후 다시 불러오기
  };

  return (
    <>
      <aside className="w-full sm:w-64 bg-gradient-to-b from-purple-100 to-pink-50 p-6 flex flex-col items-center border-r border-gray-200 min-h-screen">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 mb-3 border-4 border-purple-200" />
          <div className="text-lg font-bold text-purple-700 mb-1">루나</div>
          <div className="text-xs text-gray-500 mb-2">♡ 당신의 AI 친구</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            <span className="text-xs text-green-600">온라인</span>
            <span className="text-xs text-gray-400 ml-2">|</span>
            <span className="text-xs text-gray-400">친근함</span>
          </div>
          <div className="text-xs text-gray-400 mb-4">
            {currentSettings.speechStyle} 모드
          </div>
        </div>

        {/* 메뉴 버튼들 */}
        <div className="w-full space-y-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow hover:from-purple-500 hover:to-pink-500 transition"
          >
            AI 친구 설정
          </button>

          {/* 에이전트 상태 버튼 추가 */}
          <button
            onClick={() => setIsAgentStatusOpen(true)}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold shadow hover:from-green-500 hover:to-blue-500 transition"
          >
            🤖 AI 친구 상태
          </button>

          {/* 우리가 나눈 이야기들 버튼 추가 */}
          <button
            onClick={() => router.push("/our-stories")}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold shadow hover:from-blue-500 hover:to-purple-500 transition"
          >
            📖 우리의 이야기
          </button>

          <button
            className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      </aside>

      <AiSettingsModal isOpen={isSettingsOpen} onClose={handleSettingsClose} />
      <AgentStatusModal
        isOpen={isAgentStatusOpen}
        onClose={() => setIsAgentStatusOpen(false)}
      />
    </>
  );
}
