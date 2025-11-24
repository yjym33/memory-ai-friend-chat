import { LLMModel } from "../types";

/**
 * 모델 이름을 사용자 친화적인 형식으로 변환
 */
export const MODEL_NAMES: Record<string, string> = {
  [LLMModel.GPT_4]: "GPT-4",
  [LLMModel.GPT_4O]: "GPT-4o",
  [LLMModel.GPT_4_TURBO]: "GPT-4 Turbo",
  [LLMModel.GPT_5_1]: "GPT-5.1",
  [LLMModel.GEMINI_PRO]: "Gemini Pro",
  [LLMModel.GEMINI_ULTRA]: "Gemini Ultra",
  [LLMModel.GEMINI_1_5_PRO]: "Gemini 1.5 Pro",
  [LLMModel.GEMINI_1_5_FLASH]: "Gemini 1.5 Flash",
  [LLMModel.CLAUDE_3_OPUS]: "Claude 3 Opus",
  [LLMModel.CLAUDE_3_SONNET]: "Claude 3 Sonnet",
  [LLMModel.CLAUDE_3_HAIKU]: "Claude 3 Haiku",
  [LLMModel.CLAUDE_3_5_SONNET]: "Claude 3.5 Sonnet",
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
  if (lowerModelId.includes("gpt-4o")) return "GPT-4o";
  if (lowerModelId.includes("gpt-4-turbo")) return "GPT-4 Turbo";
  if (lowerModelId.includes("gpt-4")) return "GPT-4";
  if (lowerModelId.includes("gpt-5")) return "GPT-5.1";

  // Claude 모델
  if (lowerModelId.includes("claude-3-5-sonnet")) return "Claude 3.5 Sonnet";
  if (lowerModelId.includes("claude-3-opus")) return "Claude 3 Opus";
  if (lowerModelId.includes("claude-3-sonnet")) return "Claude 3 Sonnet";
  if (lowerModelId.includes("claude-3-haiku")) return "Claude 3 Haiku";
  if (lowerModelId.includes("claude-opus")) return "Claude Opus";
  if (lowerModelId.includes("claude-sonnet")) return "Claude Sonnet";
  if (lowerModelId.includes("claude-haiku")) return "Claude Haiku";

  // Gemini 모델
  if (lowerModelId.includes("gemini-1-5-flash")) return "Gemini 1.5 Flash";
  if (lowerModelId.includes("gemini-1-5-pro")) return "Gemini 1.5 Pro";
  if (lowerModelId.includes("gemini-ultra")) return "Gemini Ultra";
  if (lowerModelId.includes("gemini-pro")) return "Gemini Pro";

  // 매칭되지 않으면 원본 반환
  return modelId;
}

