// =====================================
// 사용자 관련 타입 (백엔드 User 엔티티 기반)
// =====================================
export interface User {
  id: string; // UUID
  email: string;
  name: string;
  gender: string;
  birthYear: string;
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
  birthYear: string;
}

// 백엔드 응답 타입
export interface AuthResponse {
  token: string;
  userId: string;
  user?: Partial<User>;
}

// =====================================
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

// =====================================
// 레거시 타입 (호환성을 위해 유지)
// =====================================
/** @deprecated Use AiSettings instead */
export type AiSettingsData = AiSettings;
