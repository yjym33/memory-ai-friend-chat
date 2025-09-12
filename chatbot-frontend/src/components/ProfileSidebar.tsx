import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { useRouter } from "next/navigation";
import axiosInstance from "../utils/axios";
import { X } from "lucide-react";

interface ProfileSidebarProps {
  onClose?: () => void;
  onOpenSettings?: () => void;
  onOpenAgentStatus?: () => void;
  onOpenGoalManager?: () => void;
}

export default function ProfileSidebar({
  onClose,
  onOpenSettings,
  onOpenAgentStatus,
  onOpenGoalManager,
}: ProfileSidebarProps) {
  const { logout } = useAuthStore();
  const router = useRouter();
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

  return (
    <>
      <aside className="w-64 lg:w-64 bg-gradient-to-b from-purple-100 to-pink-50 p-6 flex flex-col items-center border-r border-gray-200 min-h-screen">
        {/* 모바일 닫기 버튼 */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gray-200 mb-3 border-4 border-purple-200" />
          <div className="text-lg font-bold text-purple-700 mb-1">루나</div>
          <div className="text-xs text-gray-700 mb-2">♡ 당신의 AI 친구</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
            <span className="text-xs text-green-600">온라인</span>
            <span className="text-xs text-gray-600 ml-2">|</span>
            <span className="text-xs text-gray-600">친근함</span>
          </div>
          <div className="text-xs text-gray-600 mb-4">
            {currentSettings.speechStyle} 모드
          </div>
        </div>

        {/* 메뉴 버튼들 */}
        <div className="w-full space-y-3">
          <button
            onClick={() => onOpenSettings?.()}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-400 to-pink-400 text-white font-semibold shadow hover:from-purple-500 hover:to-pink-500 transition"
          >
            AI 친구 설정
          </button>

          {/* 에이전트 상태 버튼 추가 */}
          <button
            onClick={() => onOpenAgentStatus?.()}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-green-400 to-blue-400 text-white font-semibold shadow hover:from-green-500 hover:to-blue-500 transition"
          >
            AI 친구 상태
          </button>

          {/* 목표 관리 버튼 추가 */}
          <button
            onClick={() => onOpenGoalManager?.()}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-orange-400 to-red-400 text-white font-semibold shadow hover:from-orange-500 hover:to-red-500 transition"
          >
            목표 관리
          </button>

          {/* 우리가 나눈 이야기들 버튼 추가 */}
          <button
            onClick={() => router.push("/our-stories")}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-blue-400 to-purple-400 text-white font-semibold shadow hover:from-blue-500 hover:to-purple-500 transition"
          >
            우리의 이야기
          </button>

          <button
            className="w-full py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>
      </aside>
    </>
  );
}
