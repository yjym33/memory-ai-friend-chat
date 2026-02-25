"use client";

import React from "react";
import { ImageProvider, ImageProviderInfo } from "../../types";
import { getImageModelDisplayName } from "../../utils/modelNames";

interface MultiImageProviderSelectorProps {
  providers: ImageProviderInfo[];
  selectedProviders: ImageProvider[];
  onSelectionChange: (providers: ImageProvider[]) => void;
  minSelection?: number;
  maxSelection?: number;
}

/**
 * Provider 아이콘 반환
 */
const getProviderIcon = (provider: ImageProvider | string): string => {
  const providerMap: Record<string, string> = {
    dalle: "🎨",
    stability: "🖼️",
    "google-imagen": "✨",
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return providerMap[providerLower] || "🔮";
};

/**
 * Provider별 색상 테마
 */
const getProviderTheme = (
  provider: ImageProvider | string
): { bg: string; bgSelected: string; border: string; text: string } => {
  const themes: Record<
    string,
    { bg: string; bgSelected: string; border: string; text: string }
  > = {
    dalle: {
      bg: "bg-emerald-50",
      bgSelected: "bg-emerald-100",
      border: "border-emerald-500",
      text: "text-emerald-700",
    },
    stability: {
      bg: "bg-orange-50",
      bgSelected: "bg-orange-100",
      border: "border-orange-500",
      text: "text-orange-700",
    },
    "google-imagen": {
      bg: "bg-blue-50",
      bgSelected: "bg-blue-100",
      border: "border-blue-500",
      text: "text-blue-700",
    },
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return (
    themes[providerLower] || {
      bg: "bg-gray-50",
      bgSelected: "bg-gray-100",
      border: "border-gray-500",
      text: "text-gray-700",
    }
  );
};

/**
 * Multi-Image Provider 선택 컴포넌트
 * 사용할 이미지 생성 AI를 선택할 수 있습니다.
 */
export const MultiImageProviderSelector: React.FC<
  MultiImageProviderSelectorProps
> = ({
  providers,
  selectedProviders,
  onSelectionChange,
  minSelection = 1,
  maxSelection = 3,
}) => {
  const handleToggle = (provider: ImageProvider) => {
    const isSelected = selectedProviders.includes(provider);

    if (isSelected) {
      // 최소 선택 개수 체크
      if (selectedProviders.length <= minSelection) {
        return;
      }
      onSelectionChange(selectedProviders.filter((p) => p !== provider));
    } else {
      // 최대 선택 개수 체크
      if (selectedProviders.length >= maxSelection) {
        return;
      }
      onSelectionChange([...selectedProviders, provider]);
    }
  };

  const selectAll = () => {
    const availableProviders = providers
      .filter((p) => p.available)
      .map((p) => p.provider)
      .slice(0, maxSelection);
    onSelectionChange(availableProviders);
  };

  const selectedCount = selectedProviders.length;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">
            🎨 이미지 AI 선택
          </span>
          <span className="text-xs text-gray-400">
            ({selectedCount}/{maxSelection} 선택)
          </span>
        </div>
        <button
          onClick={selectAll}
          className="text-xs text-pink-600 hover:text-pink-800 font-medium"
        >
          모두 선택
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => {
          const isSelected = selectedProviders.includes(provider.provider);
          const isDisabled = !provider.available;
          const theme = getProviderTheme(provider.provider);

          return (
            <button
              key={provider.provider}
              onClick={() => !isDisabled && handleToggle(provider.provider)}
              disabled={isDisabled}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all
                ${isDisabled ? "opacity-50 cursor-not-allowed bg-gray-100 border-gray-200" : "cursor-pointer"}
                ${isSelected && !isDisabled ? `${theme.bgSelected} ${theme.border}` : `${theme.bg} border-transparent hover:border-gray-300`}
              `}
            >
              <span className="text-xl">
                {getProviderIcon(provider.provider)}
              </span>
              <div className="text-left">
                <span
                  className={`font-medium ${isDisabled ? "text-gray-400" : theme.text}`}
                >
                  {provider.name}
                </span>
                <span className="text-xs text-gray-400 block">
                  {isDisabled ? "API 키 필요" : getImageModelDisplayName(provider.defaultModel)}
                </span>
              </div>
              {isSelected && !isDisabled && (
                <span className={`${theme.text} font-bold`}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {selectedCount < minSelection && (
        <p className="mt-2 text-xs text-red-500">
          최소 {minSelection}개 이상의 이미지 AI를 선택해야 합니다.
        </p>
      )}
    </div>
  );
};

export default MultiImageProviderSelector;

