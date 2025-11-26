"use client";

import React, { useState } from "react";
import { ProviderResponse, LLMProvider } from "../../types";

interface MultiModelResponseSelectorProps {
  responses: ProviderResponse[];
  userMessage: string;
  onSelect: (response: ProviderResponse) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Provider 이름을 사용자 친화적으로 변환
 */
const getProviderDisplayName = (provider: LLMProvider | string): string => {
  const providerMap: Record<string, { name: string; icon: string }> = {
    openai: { name: "GPT", icon: "🤖" },
    google: { name: "Gemini", icon: "✨" },
    anthropic: { name: "Claude", icon: "🧠" },
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return providerMap[providerLower]?.name || provider;
};

/**
 * Provider 아이콘 반환
 */
const getProviderIcon = (provider: LLMProvider | string): string => {
  const providerMap: Record<string, string> = {
    openai: "🤖",
    google: "✨",
    anthropic: "🧠",
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return providerMap[providerLower] || "🔮";
};

/**
 * Provider별 색상 테마
 */
const getProviderTheme = (
  provider: LLMProvider | string
): { bg: string; border: string; text: string; ring: string } => {
  const themes: Record<
    string,
    { bg: string; border: string; text: string; ring: string }
  > = {
    openai: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-700",
      ring: "ring-emerald-500",
    },
    google: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-700",
      ring: "ring-blue-500",
    },
    anthropic: {
      bg: "bg-purple-50",
      border: "border-purple-300",
      text: "text-purple-700",
      ring: "ring-purple-500",
    },
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return (
    themes[providerLower] || {
      bg: "bg-gray-50",
      border: "border-gray-300",
      text: "text-gray-700",
      ring: "ring-gray-500",
    }
  );
};

/**
 * Multi-Model 응답 선택 컴포넌트
 * 여러 AI 모델의 응답을 표시하고 사용자가 선택할 수 있습니다.
 */
export const MultiModelResponseSelector: React.FC<
  MultiModelResponseSelectorProps
> = ({ responses, userMessage, onSelect, onCancel, isLoading = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const successfulResponses = responses.filter((r) => r.success);
  const failedResponses = responses.filter((r) => !r.success);

  const handleSelect = () => {
    if (selectedIndex !== null && successfulResponses[selectedIndex]) {
      onSelect(successfulResponses[selectedIndex]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🤖 여러 AI의 답변을 비교해보세요
        </h3>
        <p className="text-sm text-gray-500">
          각 AI 모델이 제공한 답변 중 마음에 드는 것을 선택하세요
        </p>
      </div>

      {/* 사용자 질문 표시 */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <span className="text-xs text-gray-500 block mb-1">내 질문</span>
        <p className="text-gray-800">{userMessage}</p>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">AI 응답을 생성하는 중...</span>
        </div>
      )}

      {/* 응답 카드들 */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {successfulResponses.map((response, idx) => {
            const theme = getProviderTheme(response.provider);
            const isSelected = selectedIndex === idx;
            const isExpanded = expandedIndex === idx;

            return (
              <div
                key={`${response.provider}-${idx}`}
                onClick={() => setSelectedIndex(idx)}
                className={`
                  relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                  ${isSelected ? `${theme.border} ${theme.bg} ring-2 ${theme.ring}` : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"}
                `}
              >
                {/* Provider 헤더 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">
                      {getProviderIcon(response.provider)}
                    </span>
                    <div>
                      <span className={`font-semibold ${theme.text}`}>
                        {getProviderDisplayName(response.provider)}
                      </span>
                      <span className="text-xs text-gray-400 block">
                        {response.model}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">
                      ⚡ {response.latency}ms
                    </span>
                    {isSelected && (
                      <span
                        className={`text-xs font-medium ${theme.text} mt-1`}
                      >
                        ✓ 선택됨
                      </span>
                    )}
                  </div>
                </div>

                {/* 응답 내용 */}
                <div
                  className={`
                  text-sm text-gray-700 whitespace-pre-wrap
                  ${isExpanded ? "" : "line-clamp-6"}
                `}
                >
                  {response.content}
                </div>

                {/* 더보기/접기 버튼 */}
                {response.content.length > 300 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedIndex(isExpanded ? null : idx);
                    }}
                    className="mt-2 text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    {isExpanded ? "접기 ▲" : "더보기 ▼"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 실패한 응답 표시 */}
      {!isLoading && failedResponses.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            ⚠️ 일부 모델에서 응답을 받지 못했습니다:
          </p>
          <div className="flex flex-wrap gap-2">
            {failedResponses.map((response, idx) => (
              <span
                key={`failed-${idx}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-600"
              >
                {getProviderIcon(response.provider)}{" "}
                {getProviderDisplayName(response.provider)}
                <span className="ml-1 text-red-400">({response.error})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      {!isLoading && successfulResponses.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={selectedIndex === null}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${
                selectedIndex !== null
                  ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            이 답변 사용하기
          </button>
        </div>
      )}

      {/* 응답이 없는 경우 */}
      {!isLoading && successfulResponses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            모든 AI 모델에서 응답을 받지 못했습니다.
          </p>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiModelResponseSelector;

