// === 사용자 관련 타입 ===
export interface User {
  id: string;
  name: string;
  email: string;
}

// === 메시지 관련 타입 ===
export interface Message {
  id?: string;
  content: string;
  role: "user" | "assistant" | "system";
  timestamp?: Date | string;
}

// === 대화 관련 타입 ===
export interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt?: string;
  pinned?: boolean;
}

// === 채팅 세션 (Zustand 스토어용) ===
export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// === 파일 업로드 관련 타입 ===
export interface UploadedFile {
  originalName: string;
  path: string;
  filename: string;
  size: number;
}

// === 인증 관련 타입 ===
export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// === 분석 데이터 관련 타입 ===
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

// === AI 설정 관련 타입 ===
export interface AiSettingsData {
  personalityType: string;
  speechStyle: string;
  emojiUsage: number;
  nickname: string;
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
    importantDates: string[];
  };
  avoidTopics: string[];
}

// === 에이전트 상태 관련 타입 ===
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
