import React from "react";
import { ImageProvider, ImageModel } from "../../types";

// Provider별 사용 가능한 모델
const AVAILABLE_IMAGE_MODELS: Record<string, { id: string; name: string; description: string }[]> = {
  [ImageProvider.DALLE]: [
    { id: ImageModel.DALLE_3, name: "DALL-E 3", description: "최신 고품질 이미지 생성 (권장)" },
    { id: ImageModel.DALLE_2, name: "DALL-E 2", description: "빠른 이미지 생성" },
  ],
  [ImageProvider.STABILITY]: [
    { id: ImageModel.SDXL_1_0, name: "SDXL 1.0", description: "고해상도 이미지 생성 (권장)" },
    { id: ImageModel.SD_1_6, name: "SD 1.6", description: "안정적인 이미지 생성" },
  ],
  [ImageProvider.GOOGLE_IMAGEN]: [
    { id: ImageModel.GEMINI_FLASH_IMAGE, name: "Gemini 2.0 Flash", description: "빠른 이미지 생성 (권장)" },
    { id: ImageModel.GEMINI_FLASH_IMAGE_PREVIEW, name: "Gemini Flash Preview", description: "이미지 생성 전용 모델" },
  ],
};

// Provider 정보
const IMAGE_PROVIDERS = [
  {
    id: ImageProvider.DALLE,
    name: "DALL-E (OpenAI)",
    description: "OpenAI의 고품질 이미지 생성 모델",
    icon: "🖼️",
    features: ["고품질", "다양한 스타일", "HD 지원"],
  },
  {
    id: ImageProvider.STABILITY,
    name: "Stability AI",
    description: "Stable Diffusion 기반 이미지 생성",
    icon: "🎨",
    features: ["저렴한 비용", "다양한 크기", "네거티브 프롬프트"],
  },
  {
    id: ImageProvider.GOOGLE_IMAGEN,
    name: "Google Imagen (Nano Banana)",
    description: "Google Gemini 기반 이미지 생성",
    icon: "🍌",
    features: ["한글 지원 우수", "빠른 생성", "기존 API 키 활용"],
  },
];

interface ImageSettingsProps {
  imageSettings: {
    provider: ImageProvider;
    model: string;
    defaultSize: string;
    defaultQuality: string;
    defaultStyle: string;
  };
  onSettingsChange: (settings: {
    provider: ImageProvider;
    model: string;
    defaultSize: string;
    defaultQuality: string;
    defaultStyle: string;
  }) => void;
}

export default function ImageSettings({
  imageSettings,
  onSettingsChange,
}: ImageSettingsProps) {
  const currentProvider = IMAGE_PROVIDERS.find(p => p.id === imageSettings.provider);
  const currentModels = AVAILABLE_IMAGE_MODELS[imageSettings.provider] || [];

  const handleProviderChange = (providerId: ImageProvider) => {
    // Provider 변경 시 해당 Provider의 기본 모델로 설정
    const defaultModel = AVAILABLE_IMAGE_MODELS[providerId]?.[0]?.id || "";
    onSettingsChange({
      ...imageSettings,
      provider: providerId,
      model: defaultModel,
    });
  };

  const handleModelChange = (modelId: string) => {
    onSettingsChange({
      ...imageSettings,
      model: modelId,
    });
  };

  const handleSizeChange = (size: string) => {
    onSettingsChange({
      ...imageSettings,
      defaultSize: size,
    });
  };

  const handleQualityChange = (quality: string) => {
    onSettingsChange({
      ...imageSettings,
      defaultQuality: quality,
    });
  };

  const handleStyleChange = (style: string) => {
    onSettingsChange({
      ...imageSettings,
      defaultStyle: style,
    });
  };

  return (
    <div className="space-y-6">
      {/* Provider 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🎨 이미지 생성 AI 선택
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {IMAGE_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                imageSettings.provider === provider.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{provider.icon}</span>
                <span className="font-medium text-gray-900">{provider.name}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{provider.description}</p>
              <div className="flex flex-wrap gap-1">
                {provider.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 모델 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🤖 이미지 생성 모델
        </label>
        <div className="space-y-2">
          {currentModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelChange(model.id)}
              className={`w-full p-3 rounded-lg border text-left transition-all ${
                imageSettings.model === model.id
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">{model.name}</span>
                  <p className="text-xs text-gray-600">{model.description}</p>
                </div>
                {imageSettings.model === model.id && (
                  <span className="text-purple-500">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DALL-E 전용 설정 */}
      {imageSettings.provider === ImageProvider.DALLE && (
        <>
          {/* 이미지 크기 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📐 기본 이미지 크기
            </label>
            <div className="flex flex-wrap gap-2">
              {["1024x1024", "1792x1024", "1024x1792"].map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    imageSettings.defaultSize === size
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                >
                  {size === "1024x1024" ? "정사각형" : size === "1792x1024" ? "가로형" : "세로형"}
                  <span className="text-xs text-gray-500 ml-1">({size})</span>
                </button>
              ))}
            </div>
          </div>

          {/* 이미지 품질 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ✨ 이미지 품질
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleQualityChange("standard")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  imageSettings.defaultQuality === "standard"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                Standard
                <span className="text-xs text-gray-500 block">빠른 생성</span>
              </button>
              <button
                onClick={() => handleQualityChange("hd")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  imageSettings.defaultQuality === "hd"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                HD
                <span className="text-xs text-gray-500 block">고품질</span>
              </button>
            </div>
          </div>

          {/* 이미지 스타일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎭 이미지 스타일
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleStyleChange("vivid")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  imageSettings.defaultStyle === "vivid"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                Vivid
                <span className="text-xs text-gray-500 block">생동감 있는</span>
              </button>
              <button
                onClick={() => handleStyleChange("natural")}
                className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                  imageSettings.defaultStyle === "natural"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                Natural
                <span className="text-xs text-gray-500 block">자연스러운</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 사용법 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">💡 이미지 생성 사용법</h4>
        <p className="text-sm text-blue-700 mb-2">
          채팅에서 다음과 같이 요청하면 이미지가 생성됩니다:
        </p>
        <ul className="text-sm text-blue-600 space-y-1">
          <li>• &quot;그림 그려줘 - 강아지가 공원에서 뛰어노는 모습&quot;</li>
          <li>• &quot;/image 우주에서 본 지구&quot;</li>
          <li>• &quot;이미지 생성해줘 사이버펑크 도시&quot;</li>
        </ul>
      </div>

      {/* 현재 선택된 설정 요약 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-700 mb-2">📋 현재 설정</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Provider:</span>{" "}
            <span className="font-medium">{currentProvider?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">모델:</span>{" "}
            <span className="font-medium">
              {currentModels.find(m => m.id === imageSettings.model)?.name || imageSettings.model}
            </span>
          </div>
          {imageSettings.provider === ImageProvider.DALLE && (
            <>
              <div>
                <span className="text-gray-500">크기:</span>{" "}
                <span className="font-medium">{imageSettings.defaultSize || "1024x1024"}</span>
              </div>
              <div>
                <span className="text-gray-500">품질:</span>{" "}
                <span className="font-medium">{imageSettings.defaultQuality || "standard"}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

