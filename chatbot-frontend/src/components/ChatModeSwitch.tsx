"use client";

import { useState, useEffect } from "react";
import { Brain, Building2, Loader2 } from "lucide-react";

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

        const response = await fetch("/api/ai-settings/available-modes", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableModes(data.availableModes);
        } else {
          setAvailableModes([ChatMode.PERSONAL]);
        }
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

        const response = await fetch("/api/ai-settings", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const settings = await response.json();
          setCurrentMode(settings.chatMode || ChatMode.PERSONAL);
        }
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
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai-settings/switch-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: newMode }),
      });

      if (response.ok) {
        setCurrentMode(newMode);
        onModeChange?.(newMode);

        // 간단한 알림 (toast 대신)
        console.log(`모드가 ${getModeLabel(newMode)}로 변경되었습니다.`);
      } else {
        throw new Error("모드 변경에 실패했습니다.");
      }
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
      <div className="flex items-center space-x-2 p-4 bg-gray-100 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-600">
          모드 설정을 불러오는 중...
        </span>
      </div>
    );
  }

  // 기업 모드를 사용할 수 없는 경우
  if (!availableModes.includes(ChatMode.BUSINESS)) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          {getModeIcon(ChatMode.PERSONAL)}
          <span className="font-medium">
            {getModeLabel(ChatMode.PERSONAL)} 모드
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            활성
          </span>
        </div>
        <p className="text-sm text-gray-600">
          {getModeDescription(ChatMode.PERSONAL)}
        </p>
        <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
          <p className="text-xs text-blue-700">
            💡 기업 쿼리 모드를 사용하려면 조직에 가입하세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현재 모드 표시 */}
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getModeIcon(currentMode)}
            <span className="font-medium">
              {getModeLabel(currentMode)} 모드
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                currentMode === ChatMode.PERSONAL
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              활성
            </span>
          </div>

          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {getModeDescription(currentMode)}
        </p>

        {/* 모드 스위치 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => switchMode(ChatMode.PERSONAL)}
            disabled={disabled || isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentMode === ChatMode.PERSONAL
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>AI 친구</span>
          </button>

          <button
            onClick={() => switchMode(ChatMode.BUSINESS)}
            disabled={disabled || isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              currentMode === ChatMode.BUSINESS
                ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>기업 쿼리</span>
          </button>
        </div>
      </div>

      {/* 모드별 설명 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className={`p-3 rounded-lg border-2 transition-colors ${
            currentMode === ChatMode.PERSONAL
              ? "border-blue-200 bg-blue-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">AI 친구 모드</span>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 감정적 교감과 개인 대화</li>
            <li>• 목표 관리 및 동기 부여</li>
            <li>• 지속적인 기억과 관계 형성</li>
          </ul>
        </div>

        <div
          className={`p-3 rounded-lg border-2 transition-colors ${
            currentMode === ChatMode.BUSINESS
              ? "border-green-200 bg-green-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex items-center space-x-2 mb-2">
            <Building2 className="w-4 h-4 text-green-500" />
            <span className="font-medium text-sm">기업 쿼리 모드</span>
          </div>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 회사 문서 기반 정확한 답변</li>
            <li>• 정책, 규정, 매뉴얼 검색</li>
            <li>• 출처 명시 및 신뢰성 보장</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
