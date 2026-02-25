// =====================================
// 사용자 관련 타입 (백엔드 User 엔티티 기반)
// =====================================
export interface User {
  id: string; // UUID
  email: string;
  name: string;
  gender: string;
  birthYear: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =====================================
// 메시지 관련 타입 (백엔드 Conversation.messages 기반)
// =====================================
export interface Message {
  role: "user" | "assistant";
  content: string;
  // 프론트엔드에서만 사용하는 추가 필드들
  id?: string;
  timestamp?: Date | string;
  sources?: Array<{
    title: string;
    documentId: string;
    type?: string;
    relevance: number;
    snippet?: string;
  }>;
  // 이미지 생성 지원
  messageType?: 'text' | 'image' | 'mixed';
  images?: string[];
  imageMetadata?: {
    model: string;
    provider: string;
    prompt?: string;
  };
}

// =====================================
// 대화 관련 타입 (백엔드 Conversation 엔티티 기반)
// =====================================
export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  userId: string;
  pinned: boolean;
  isArchived?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =====================================
// 채팅 세션 (Zustand 스토어용)
// =====================================
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// =====================================
// 인증 관련 타입 (백엔드 DTO 기반)
// =====================================
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  gender: string;
  birthYear: number;
}

// 백엔드 응답 타입
export interface AuthResponse {
  token: string;
  userId: string;
  userType?: string;
  role?: string;
  organizationId?: string;
  user?: Partial<User>;
}

// =====================================
// LLM Provider 타입
export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
  ANTHROPIC = 'anthropic',
}

// LLM 모델 타입
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

// LLM 설정 타입
export interface LLMConfig {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
  [key: string]: any;
}

// =====================================
// 이미지 생성 관련 타입
// =====================================
export enum ImageProvider {
  DALLE = 'dalle',
  STABILITY = 'stability',
  GOOGLE_IMAGEN = 'google-imagen',
}

export enum ImageModel {
  // OpenAI DALL-E
  DALLE_3 = 'dall-e-3',
  DALLE_2 = 'dall-e-2',
  // Stability AI
  SDXL_1_0 = 'stable-diffusion-xl-1024-v1-0',
  SD_1_6 = 'stable-diffusion-v1-6',
  // Google Imagen / Gemini
  GEMINI_FLASH_IMAGE = 'gemini-2.0-flash-exp',
  GEMINI_FLASH_IMAGE_PREVIEW = 'gemini-2.0-flash-preview-image-generation',
  IMAGEN_3 = 'imagen-3',
}

export type ImageSize =
  | '256x256'
  | '512x512'
  | '768x768'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

export type ImageQuality = 'standard' | 'hd';
export type ImageStyle = 'vivid' | 'natural';

export interface ImageGenerationConfig {
  defaultSize?: ImageSize;
  defaultQuality?: ImageQuality;
  defaultStyle?: ImageStyle;
  maxImagesPerRequest?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
  n?: number;
}

export interface GeneratedImage {
  url: string;
  base64?: string;
  revisedPrompt?: string;
  width: number;
  height: number;
}

export interface ImageGenerationResponse {
  images: GeneratedImage[];
  model: string;
  provider: ImageProvider;
  usage?: {
    cost?: number;
  };
}

// =====================================
// Multi-Image Orchestrator 타입
// =====================================

/**
 * 개별 이미지 Provider 응답
 */
export interface ProviderImageResponse {
  provider: ImageProvider;
  model: string;
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  latency: number;
}

/**
 * Multi-Image 응답
 */
export interface MultiImageResponse {
  success: boolean;
  isImageGeneration: boolean;
  isMultiImage: boolean;
  response: string;
  prompt: string;
  images: string[];
  imageMetadata: Array<{
    provider: string;
    model: string;
    url: string;
  }>;
  multiImageResponses: ProviderImageResponse[];
  totalLatency: number;
  successCount: number;
  failCount: number;
  error?: string;
}

/**
 * 이미지 Provider 정보
 */
export interface ImageProviderInfo {
  provider: ImageProvider;
  name: string;
  defaultModel: string;
  available: boolean;
}

/**
 * 사용 가능한 이미지 Provider 목록 응답
 */
export interface AvailableImageProvidersResponse {
  success: boolean;
  providers: ImageProviderInfo[];
  available: ImageProvider[];
}

// AI 설정 관련 타입 (백엔드 AiSettings 엔티티 기반)
// =====================================
export interface AiSettings {
  id: number;
  userId: string;
  personalityType: string; // '친근함', '차분함', '활발함', '따뜻함'
  speechStyle: string; // '격식체', '반말'
  emojiUsage: number; // 1-5
  nickname: string | null;
  empathyLevel: number; // 1-5
  memoryRetentionDays: number;
  memoryPriorities: {
    personal: number; // 1-5
    hobby: number;
    work: number;
    emotion: number;
  };
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };
  avoidTopics: string[];
  llmProvider?: LLMProvider;
  llmModel?: string;
  llmConfig?: LLMConfig;
  // 이미지 생성 설정
  imageProvider?: ImageProvider;
  imageModel?: string;
  imageConfig?: ImageGenerationConfig;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// AI 설정 생성/수정용 DTO
export interface CreateAiSettingsDto {
  personalityType: string;
  speechStyle: string;
  emojiUsage: number;
  nickname?: string;
  empathyLevel: number;
  memoryRetentionDays: number;
  memoryPriorities: {
    personal: number;
    hobby: number;
    work: number;
    emotion: number;
  };
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };
  avoidTopics: string[];
  llmProvider?: LLMProvider;
  llmModel?: string;
  llmConfig?: LLMConfig;
  // 이미지 생성 설정
  imageProvider?: ImageProvider;
  imageModel?: string;
  imageConfig?: ImageGenerationConfig;
}

export type UpdateAiSettingsDto = CreateAiSettingsDto;

// =====================================
// 목표 관련 타입 (백엔드 Goal 엔티티 기반)
// =====================================
export enum GoalStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  CANCELLED = "cancelled",
}

export enum GoalCategory {
  HEALTH = "health",
  CAREER = "career",
  EDUCATION = "education",
  RELATIONSHIP = "relationship",
  FINANCE = "finance",
  PERSONAL = "personal",
  HOBBY = "hobby",
  TRAVEL = "travel",
  OTHER = "other",
}

export interface Goal {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  status: GoalStatus;
  progress: number; // 0-100
  targetDate: Date | string | null;
  priority: number; // 1-10
  milestones: string[];
  lastCheckedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =====================================
// 감정 관련 타입 (백엔드 Emotion 엔티티 기반)
// =====================================
export enum EmotionType {
  HAPPY = "happy",
  SAD = "sad",
  ANGRY = "angry",
  ANXIOUS = "anxious",
  EXCITED = "excited",
  FRUSTRATED = "frustrated",
  CALM = "calm",
  STRESSED = "stressed",
  CONFUSED = "confused",
  PROUD = "proud",
}

export interface Emotion {
  id: number;
  userId: string;
  type: EmotionType;
  intensity: number; // 1-10
  context: string | null;
  trigger: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// =====================================
// 파일 업로드 관련 타입
// =====================================
export interface UploadedFile {
  originalName: string;
  path: string;
  filename: string;
  size: number;
}

// =====================================
// 분석 데이터 관련 타입 (our-stories 페이지용)
// =====================================
export interface Milestone {
  date: string;
  type: string;
  title: string;
  description: string;
  conversationId: number;
}

export interface AnalyticsData {
  milestones: Milestone[];
  emotionTimeline: { date: string; score: number }[];
  favoriteTopics: { topic: string; count: number }[];
  totalConversations: number;
  relationshipDuration: number;
  emotionalJourney: string;
}

// =====================================
// 에이전트 상태 관련 타입
// =====================================
export interface AgentStatus {
  currentMood: string;
  energyLevel: number;
  memories: {
    count: number;
    lastUpdated: string;
  };
  goals: {
    active: number;
    completed: number;
  };
  conversations: {
    total: number;
    today: number;
  };
}

// =====================================
// 문서 관련 타입
// =====================================
export interface Document {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
  };
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EmbeddingStatus {
  totalChunks: number;
  embeddedChunks: number;
  pendingChunks: number;
  embeddingProgress: number;
}

// =====================================
// 조직 관련 타입
// =====================================
export interface Organization {
  id: string;
  name: string;
  description?: string;
  type: string;
  subscriptionTier: string;
  domain?: string;
  createdAt: string;
  users?: User[];
}

// =====================================
// API 응답 공통 타입
// =====================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  meta: PaginationMeta;
}

// 실제 백엔드 응답 패턴들
export interface ListResponse<T = unknown> {
  [key: string]: T[] | PaginationMeta | unknown;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    totalPages: number;
    total: number;
    page: number;
    limit: number;
  };
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: {
    totalPages: number;
    total: number;
    page: number;
    limit: number;
  };
}

export interface OrganizationListResponse {
  organizations: Organization[];
  pagination: {
    totalPages: number;
    total: number;
    page: number;
    limit: number;
  };
}

export interface StatisticsResponse {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalDocuments: number;
  totalStorage: number;
  dailyActive: number;
  monthlyActive: number;
  storageUsed: number;
  storageLimit: number;
}

export interface EmbeddingStatusResponse {
  totalDocuments: number;
  embeddedDocuments: number;
  pendingDocuments: number;
  failedDocuments: number;
  processingDocuments: number;
  lastProcessedAt: string | null;
  estimatedTimeRemaining: number | null;
}

// 응답 타입 유니온
export type ApiResponseType<T = unknown> =
  | T
  | T[]
  | UserListResponse
  | DocumentListResponse
  | OrganizationListResponse
  | StatisticsResponse
  | EmbeddingStatusResponse
  | PaginatedResponse<T>
  | ListResponse<T>;

// =====================================
// Multi-Model Orchestrator 타입
// =====================================

/**
 * 개별 Provider 응답
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
 * Multi-Model 응답
 */
export interface MultiModelResponse {
  success: boolean;
  responses: ProviderResponse[];
  totalLatency: number;
  successCount: number;
  failCount: number;
  error?: string;
  // 이미지 생성 관련 필드
  isImageGeneration?: boolean;
  response?: string;
  images?: string[];
  imageMetadata?: {
    model: string;
    provider: string;
    prompt?: string;
  };
}

/**
 * Provider 정보
 */
export interface ProviderInfo {
  provider: LLMProvider;
  name: string;
  defaultModel: string;
  available: boolean;
}

/**
 * 사용 가능한 Provider 목록 응답
 */
export interface AvailableProvidersResponse {
  providers: ProviderInfo[];
  available: LLMProvider[];
}

/**
 * Multi-Model 스트리밍 청크
 */
export interface MultiModelStreamChunk {
  provider: LLMProvider;
  model: string;
  chunk: string;
}

/**
 * Multi-Model 완료 이벤트
 */
export interface MultiModelCompleteEvent {
  provider: LLMProvider;
  model: string;
  content: string;
}

/**
 * Multi-Model 에러 이벤트
 */
export interface MultiModelErrorEvent {
  provider: LLMProvider;
  error: string;
}

/**
 * 합의 응답
 */
export interface ConsensusResponse {
  success: boolean;
  consensus?: string;
  sources?: ProviderResponse[];
  error?: string;
}

/**
 * 선택된 응답 저장 요청
 */
export interface SelectResponseRequest {
  userMessage: string;
  selectedProvider: string;
  selectedModel: string;
  selectedContent: string;
  allResponses: Array<{
    provider: string;
    model: string;
    content: string;
    latency: number;
  }>;
}

// =====================================
// 프론트엔드 전용 타입
// =====================================
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// =====================================
// 타입 가드 함수들
// =====================================
export const isMessage = (obj: unknown): obj is Message => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "role" in obj &&
    "content" in obj &&
    typeof (obj as Record<string, unknown>).role === "string" &&
    typeof (obj as Record<string, unknown>).content === "string"
  );
};

export const isConversation = (obj: unknown): obj is Conversation => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "id" in obj &&
    "title" in obj &&
    "messages" in obj &&
    typeof (obj as Record<string, unknown>).id === "number" &&
    typeof (obj as Record<string, unknown>).title === "string" &&
    Array.isArray((obj as Record<string, unknown>).messages)
  );
};

export const isUser = (obj: unknown): obj is User => {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "id" in obj &&
    "email" in obj &&
    typeof (obj as Record<string, unknown>).id === "string" &&
    typeof (obj as Record<string, unknown>).email === "string"
  );
};

