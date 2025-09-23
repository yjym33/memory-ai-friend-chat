"use client";

import { useState, useEffect } from "react";
import { Brain, Building2, Loader2 } from "lucide-react";
import { apiClient } from "../services/apiClient";

export enum ChatMode {
  PERSONAL = "personal",
  BUSINESS = "business",
}

interface ChatModeSwitchProps {
  onModeChange?: (mode: ChatMode) => void;
  disabled?: boolean;
}

export function ChatModeSwitch({
  onModeChange,
  disabled = false,
}: ChatModeSwitchProps) {
  const [currentMode, setCurrentMode] = useState<ChatMode>(ChatMode.PERSONAL);
  const [availableModes, setAvailableModes] = useState<ChatMode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // 사용 가능한 모드 조회
  useEffect(() => {
    const fetchAvailableModes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setAvailableModes([ChatMode.PERSONAL]);
          setIsInitializing(false);
          return;
        }

        const data = await apiClient.get<{ availableModes: string[] }>(
          "/ai-settings/available-modes"
        );
        setAvailableModes(data.availableModes as ChatMode[]);
      } catch (error) {
        console.error("사용 가능한 모드 조회 실패:", error);
        setAvailableModes([ChatMode.PERSONAL]);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchAvailableModes();
  }, []);

  // 현재 설정된 모드 조회
  useEffect(() => {
    const fetchCurrentSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const settings = await apiClient.get<{ chatMode: string }>(
          "/ai-settings"
        );
        setCurrentMode((settings.chatMode as ChatMode) || ChatMode.PERSONAL);
      } catch (error) {
        console.error("현재 설정 조회 실패:", error);
      }
    };

    if (!isInitializing) {
      fetchCurrentSettings();
    }
  }, [isInitializing]);

  const switchMode = async (newMode: ChatMode) => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    try {
      await apiClient.post("/ai-settings/switch-mode", { mode: newMode });

      setCurrentMode(newMode);
      onModeChange?.(newMode);

      // 간단한 알림 (toast 대신)
      console.log(`모드가 ${getModeLabel(newMode)}로 변경되었습니다.`);
    } catch (error) {
      console.error("모드 변경 실패:", error);
      alert("모드 변경 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getModeLabel = (mode: ChatMode) => {
    return mode === ChatMode.PERSONAL ? "AI 친구" : "기업 쿼리";
  };

  const getModeIcon = (mode: ChatMode) => {
    return mode === ChatMode.PERSONAL ? (
      <Brain className="w-4 h-4" />
    ) : (
      <Building2 className="w-4 h-4" />
    );
  };

  const getModeDescription = (mode: ChatMode) => {
    return mode === ChatMode.PERSONAL
      ? "개인적인 대화와 감정 교류를 위한 AI 친구"
      : "회사 문서 기반 질문 답변 시스템";
  };

  if (isInitializing) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">
          모드 설정을 불러오는 중...
        </span>
      </div>
    );
  }

  // 기업 모드를 사용할 수 없는 경우
  if (!availableModes.includes(ChatMode.BUSINESS)) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getModeIcon(ChatMode.PERSONAL)}
          <span className="font-semibold text-gray-900">
            {getModeLabel(ChatMode.PERSONAL)}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
            활성
          </span>
        </div>
        <div className="text-xs text-gray-500">
          🔒 기업 모드는 관리자 승인 후 이용 가능
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {/* 현재 모드 표시 */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          {getModeIcon(currentMode)}
          <span className="font-semibold text-gray-900">
            {getModeLabel(currentMode)}
          </span>
        </div>
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* 모드 스위치 버튼 */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => switchMode(ChatMode.PERSONAL)}
          disabled={disabled || isLoading}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentMode === ChatMode.PERSONAL
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>AI 친구</span>
        </button>

        <button
          onClick={() => switchMode(ChatMode.BUSINESS)}
          disabled={disabled || isLoading}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
            currentMode === ChatMode.BUSINESS
              ? "bg-white text-green-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>기업 쿼리</span>
        </button>
      </div>
    </div>
  );
}
