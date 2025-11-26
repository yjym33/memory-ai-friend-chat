"use client";

import React, { useState } from "react";
import { ImageProvider, ProviderImageResponse } from "../../types";

interface MultiImageSelectorProps {
  responses: ProviderImageResponse[];
  prompt: string;
  onSelect: (response: ProviderImageResponse, imageUrl: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Provider 이름을 사용자 친화적으로 변환
 */
const getProviderDisplayName = (provider: ImageProvider | string): string => {
  const providerMap: Record<string, { name: string; icon: string }> = {
    dalle: { name: "DALL-E", icon: "🎨" },
    stability: { name: "Stable Diffusion", icon: "🖼️" },
    "google-imagen": { name: "Gemini Imagen", icon: "✨" },
  };

  const providerLower =
    typeof provider === "string" ? provider.toLowerCase() : provider;
  return providerMap[providerLower]?.name || provider;
};

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
): { bg: string; border: string; text: string; ring: string } => {
  const themes: Record<
    string,
    { bg: string; border: string; text: string; ring: string }
  > = {
    dalle: {
      bg: "bg-emerald-50",
      border: "border-emerald-300",
      text: "text-emerald-700",
      ring: "ring-emerald-500",
    },
    stability: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-700",
      ring: "ring-orange-500",
    },
    "google-imagen": {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-700",
      ring: "ring-blue-500",
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
 * Multi-Image 선택 컴포넌트
 * 여러 AI가 생성한 이미지를 표시하고 사용자가 선택할 수 있습니다.
 */
export const MultiImageSelector: React.FC<MultiImageSelectorProps> = ({
  responses,
  prompt,
  onSelect,
  onCancel,
  isLoading = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<{
    responseIdx: number;
    imageIdx: number;
  } | null>(null);

  const successfulResponses = responses.filter(
    (r) => r.success && r.images.length > 0
  );
  const failedResponses = responses.filter((r) => !r.success);

  const handleSelect = () => {
    if (selectedIndex !== null) {
      const response = successfulResponses[selectedIndex.responseIdx];
      const imageUrl = response.images[selectedIndex.imageIdx]?.url;
      if (response && imageUrl) {
        onSelect(response, imageUrl);
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* 헤더 */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🎨 여러 AI가 생성한 이미지를 비교해보세요
        </h3>
        <p className="text-sm text-gray-500">
          각 AI가 생성한 이미지 중 마음에 드는 것을 선택하세요
        </p>
      </div>

      {/* 프롬프트 표시 */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        <span className="text-xs text-purple-500 block mb-1">프롬프트</span>
        <p className="text-gray-800 font-medium">{prompt}</p>
      </div>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent absolute top-0"></div>
          </div>
          <span className="mt-4 text-gray-600 text-lg">
            여러 AI가 이미지를 생성하는 중...
          </span>
          <span className="mt-2 text-sm text-gray-400">
            각 AI마다 고유한 스타일의 이미지를 생성합니다
          </span>
        </div>
      )}

      {/* 이미지 카드들 */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {successfulResponses.map((response, respIdx) => {
            const theme = getProviderTheme(response.provider);

            return response.images.map((image, imgIdx) => {
              const isSelected =
                selectedIndex?.responseIdx === respIdx &&
                selectedIndex?.imageIdx === imgIdx;

              return (
                <div
                  key={`${response.provider}-${respIdx}-${imgIdx}`}
                  onClick={() =>
                    setSelectedIndex({ responseIdx: respIdx, imageIdx: imgIdx })
                  }
                  className={`
                    relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                    ${isSelected ? `ring-4 ${theme.ring} shadow-xl scale-[1.02]` : "ring-1 ring-gray-200 hover:ring-2 hover:ring-gray-300 hover:shadow-lg"}
                  `}
                >
                  {/* Provider 헤더 */}
                  <div
                    className={`${theme.bg} px-4 py-2 flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">
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

                  {/* 이미지 */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={image.url}
                      alt={`${getProviderDisplayName(response.provider)} 생성 이미지`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 shadow-lg">
                          <span className="text-2xl">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            });
          })}
        </div>
      )}

      {/* 실패한 응답 표시 */}
      {!isLoading && failedResponses.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">
            ⚠️ 일부 AI에서 이미지를 생성하지 못했습니다:
          </p>
          <div className="flex flex-wrap gap-2">
            {failedResponses.map((response, idx) => (
              <span
                key={`failed-${idx}`}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-red-100 text-red-600"
              >
                {getProviderIcon(response.provider)}{" "}
                {getProviderDisplayName(response.provider)}
                <span className="ml-1 text-red-400 truncate max-w-[150px]">
                  ({response.error})
                </span>
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
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={selectedIndex === null}
            className={`
              px-8 py-3 rounded-xl font-medium transition-all
              ${
                selectedIndex !== null
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            이 이미지 사용하기
          </button>
        </div>
      )}

      {/* 응답이 없는 경우 */}
      {!isLoading && successfulResponses.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😢</div>
          <p className="text-gray-500 mb-4 text-lg">
            모든 AI에서 이미지를 생성하지 못했습니다.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            프롬프트를 수정하거나 다시 시도해주세요.
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

export default MultiImageSelector;

