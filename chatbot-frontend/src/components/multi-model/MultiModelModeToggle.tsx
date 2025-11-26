"use client";

import React from "react";

interface MultiModelModeToggleProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

/**
 * Multi-Model 모드 토글 컴포넌트
 * 단일 모드와 Multi-Model 모드를 전환합니다.
 */
export const MultiModelModeToggle: React.FC<MultiModelModeToggleProps> = ({
  isEnabled,
  onToggle,
  disabled = false,
}) => {
  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={() => !disabled && onToggle(!isEnabled)}
        disabled={disabled}
        className={`
          relative inline-flex items-center h-8 w-14 rounded-full transition-all duration-300
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${isEnabled ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gray-300"}
        `}
      >
        <span
          className={`
            inline-block w-6 h-6 transform transition-transform duration-300 rounded-full bg-white shadow-md
            ${isEnabled ? "translate-x-7" : "translate-x-1"}
          `}
        >
          <span className="flex items-center justify-center h-full text-xs">
            {isEnabled ? "🔄" : "1️⃣"}
          </span>
        </span>
      </button>

      <div className="flex flex-col">
        <span
          className={`text-sm font-medium ${isEnabled ? "text-purple-700" : "text-gray-600"}`}
        >
          {isEnabled ? "Multi-Model 모드" : "단일 모드"}
        </span>
        <span className="text-xs text-gray-400">
          {isEnabled
            ? "여러 AI의 답변을 비교합니다"
            : "하나의 AI가 응답합니다"}
        </span>
      </div>
    </div>
  );
};

export default MultiModelModeToggle;

