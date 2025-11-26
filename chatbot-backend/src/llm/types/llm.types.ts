/**
 * LLM Provider 타입 정의
 */
export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}

/**
 * LLM 모델 타입 (주요 모델들)
 */
export enum LLMModel {
  // OpenAI
  GPT_4 = 'gpt-4',
  GPT_4O = 'gpt-4o',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_5_1 = 'gpt-5.1',
  
  // Google Gemini
  GEMINI_PRO = 'gemini-pro',
  GEMINI_ULTRA = 'gemini-ultra',
  GEMINI_1_5_PRO = 'gemini-1.5-pro',
  GEMINI_1_5_FLASH = 'gemini-1.5-flash',
  
  // Anthropic Claude
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
}

/**
 * LLM 요청 타입
 */
export interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stream?: boolean;
  [key: string]: any; // 모델별 추가 파라미터
}

/**
 * LLM 응답 타입
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  finishReason?: string;
}

/**
 * LLM 스트리밍 청크 타입
 */
export interface LLMStreamChunk {
  content: string;
  done: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * LLM 설정 타입
 */
export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  [key: string]: any; // 모델별 추가 파라미터
}

// =====================================
// Multi-Model Orchestrator 타입
// =====================================

/**
 * Multi-Model 요청 타입
 */
export interface MultiModelRequest {
  providers: LLMProvider[];
  messages: Array<{ role: string; content: string }>;
  options?: Partial<LLMRequest>;
}

/**
 * 개별 Provider 응답 타입
 */
export interface ProviderResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  success: boolean;
  error?: string;
  latency: number;
}

/**
 * Multi-Model 응답 타입
 */
export interface MultiModelResponse {
  responses: ProviderResponse[];
  totalLatency: number;
  successCount: number;
  failCount: number;
}

/**
 * Provider 정보 타입
 */
export interface ProviderInfo {
  provider: LLMProvider;
  name: string;
  defaultModel: string;
  available: boolean;
}

