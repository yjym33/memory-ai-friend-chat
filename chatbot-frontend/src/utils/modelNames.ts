import { LLMModel, ImageModel } from "../types";

/**
 * LLM 모델 이름을 사용자 친화적인 형식으로 변환
 */
export const MODEL_NAMES: Record<string, string> = {
  [LLMModel.GPT_4]: "GPT-4",
  [LLMModel.GPT_4O]: "GPT-4o",
  [LLMModel.GPT_4O_MINI]: "GPT-4o mini",
  [LLMModel.GPT_5_2]: "GPT-5.2 Thinking",
  [LLMModel.GPT_5_3_CODEX]: "GPT-5.3 Codex",
  [LLMModel.O1]: "o1",
  [LLMModel.O3_MINI]: "o3-mini",
  [LLMModel.GEMINI_3_1]: "Gemini 3.1 Pro",
  [LLMModel.GEMINI_3_FLASH]: "Gemini 3 Flash",
  [LLMModel.CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
  [LLMModel.CLAUDE_3_7_SONNET]: "Claude 3.7 Sonnet",
  [LLMModel.CLAUDE_4_6_SONNET]: "Claude 4.6 Sonnet",
  [LLMModel.CLAUDE_4_6_OPUS]: "Claude 4.6 Opus",
};

/**
 * 이미지 생성 모델 이름을 사용자 친화적인 형식으로 변환
 */
export const IMAGE_MODEL_NAMES: Record<string, string> = {
  [ImageModel.DALLE_3]: "DALL-E 3",
  [ImageModel.DALLE_2]: "DALL-E 2",
  [ImageModel.SDXL_1_0]: "SDXL 1.0",
  [ImageModel.SD_1_6]: "SD 1.6",
  [ImageModel.GEMINI_FLASH_IMAGE]: "Gemini 2.0 Flash",
  [ImageModel.GEMINI_FLASH_IMAGE_PREVIEW]: "Gemini Preview",
  [ImageModel.IMAGEN_3]: "Imagen 3",
};

/**
 * 모델 ID를 사용자 친화적인 이름으로 변환
 * @param modelId - 모델 ID (예: "gpt-4", "claude-3-haiku-20240307")
 * @returns 사용자 친화적인 모델 이름 (예: "GPT-4", "Claude 3 Haiku")
 */
export function getModelDisplayName(modelId: string): string {
  // 정확한 매칭 시도
  if (MODEL_NAMES[modelId]) {
    return MODEL_NAMES[modelId];
  }

  // 부분 매칭 시도 (모델 ID의 일부를 사용)
  // 예: "gpt-4" -> "GPT-4", "claude-3-haiku-20240307" -> "Claude 3 Haiku"
  const lowerModelId = modelId.toLowerCase();

  // GPT 모델
  if (lowerModelId.includes("gpt-5.3-codex")) return "GPT-5.3 Codex";
  if (lowerModelId.includes("gpt-5.2")) return "GPT-5.2 Thinking";
  if (lowerModelId.includes("gpt-4o-mini")) return "GPT-4o mini";
  if (lowerModelId.includes("gpt-4o")) return "GPT-4o";
  if (lowerModelId.includes("o3-mini")) return "o3-mini";
  if (lowerModelId.includes("o1")) return "o1";
  if (lowerModelId.includes("gpt-5")) return "GPT-5 Core";

  // Claude 모델
  if (lowerModelId.includes("claude-sonnet-4-6")) return "Claude 4.6 Sonnet";
  if (lowerModelId.includes("claude-opus-4-6")) return "Claude 4.6 Opus";
  if (lowerModelId.includes("claude-3-7-sonnet")) return "Claude 3.7 Sonnet";
  if (lowerModelId.includes("claude-3-5-sonnet")) return "Claude 3.5 Sonnet";
  
  // Gemini 모델
  if (lowerModelId.includes("gemini-3.1")) return "Gemini 3.1 Pro";
  if (lowerModelId.includes("gemini-3-flash")) return "Gemini 3 Flash";
  if (lowerModelId.includes("gemini-pro")) return "Gemini Pro";
  if (lowerModelId.includes("gemini-ultra")) return "Gemini Ultra";

  // 매칭되지 않으면 원본 반환
  return modelId;
}

/**
 * 이미지 모델 ID를 사용자 친화적인 이름으로 변환
 * @param modelId - 모델 ID (예: "dall-e-3", "gemini-2.0-flash-exp")
 * @returns 사용자 친화적인 모델 이름 (예: "DALL-E 3", "Gemini Flash")
 */
export function getImageModelDisplayName(modelId: string): string {
  // 정확한 매칭 시도
  if (IMAGE_MODEL_NAMES[modelId]) {
    return IMAGE_MODEL_NAMES[modelId];
  }

  const lowerModelId = modelId.toLowerCase();

  // DALL-E 모델
  if (lowerModelId.includes("dall-e-3")) return "DALL-E 3";
  if (lowerModelId.includes("dall-e-2")) return "DALL-E 2";
  if (lowerModelId.includes("dalle-3")) return "DALL-E 3";
  if (lowerModelId.includes("dalle-2")) return "DALL-E 2";

  // Stable Diffusion 모델
  if (lowerModelId.includes("sdxl")) return "SDXL 1.0";
  if (lowerModelId.includes("stable-diffusion-xl")) return "SDXL 1.0";
  if (lowerModelId.includes("stable-diffusion-v1-6")) return "SD 1.6";
  if (lowerModelId.includes("sd-1-6")) return "SD 1.6";

  // Google Imagen / Gemini 모델
  if (lowerModelId.includes("gemini-2.0-flash-preview"))
    return "Gemini Preview";
  if (lowerModelId.includes("gemini-2.0-flash")) return "Gemini Flash";
  if (lowerModelId.includes("imagen")) return "Imagen";

  // 매칭되지 않으면 원본 반환
  return modelId;
}

/**
 * 이미지 Provider를 사용자 친화적인 이름으로 변환
 * @param provider - Provider ID (예: "dalle", "stability", "google-imagen")
 * @returns 사용자 친화적인 Provider 이름 (예: "DALL-E", "Stability AI", "Google Imagen")
 */
export function getImageProviderDisplayName(provider: string): string {
  const lowerProvider = provider.toLowerCase();

  if (lowerProvider === "dalle" || lowerProvider === "dall-e") return "DALL-E";
  if (lowerProvider === "stability" || lowerProvider === "stable-diffusion")
    return "Stability AI";
  if (
    lowerProvider === "google-imagen" ||
    lowerProvider === "imagen" ||
    lowerProvider === "nanobanana"
  )
    return "Google Imagen";

  return provider;
}
