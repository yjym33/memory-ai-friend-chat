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
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_5_2 = 'gpt-5.2',
  GPT_5_3_CODEX = 'gpt-5.3-codex',
  O1 = 'o1',
  O3_MINI = 'o3-mini',
  
  // Google Gemini
  GEMINI_3_1 = 'gemini-3.1-pro-preview',
  GEMINI_3_FLASH = 'gemini-3-flash',
  
  // Anthropic Claude
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet-20241022',
  CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20251022',
  CLAUDE_4_6_SONNET = 'claude-sonnet-4-6',
  CLAUDE_4_6_OPUS = 'claude-opus-4-6',
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
  // 모델별 추가 파라미터
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  stopSequences?: string[];
  seed?: number;
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
  // 모델별 추가 파라미터
  stopSequences?: string[];
  seed?: number;
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

