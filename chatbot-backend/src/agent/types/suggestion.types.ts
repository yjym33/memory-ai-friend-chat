/**
 * 추천 질문 카테고리
 */
export type SuggestionCategory =
  | 'emotion'
  | 'goal'
  | 'general'
  | 'image'
  | 'seasonal';

/**
 * 추천 질문 인터페이스
 */
export interface SuggestedQuestion {
  id: string;
  text: string;
  emoji: string;
  category: SuggestionCategory;
  priority: number; // 높을수록 먼저 표시
  reason?: string; // 왜 이 질문을 추천했는지
}

/**
 * 시간대 타입
 */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * 계절 타입
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 추천 질문 생성을 위한 컨텍스트
 */
export interface SuggestionContext {
  recentEmotions: string[];
  activeGoals: {
    title: string;
    category: string;
    progress: number;
  }[];
  lastConversationAt?: Date;
  timeOfDay: TimeOfDay;
  dayOfWeek: number;
  season: Season;
}

/**
 * 추천 질문 응답
 */
export interface SuggestionResponse {
  success: boolean;
  suggestions: SuggestedQuestion[];
  context?: {
    timeOfDay: TimeOfDay;
    season: Season;
    hasActiveGoals: boolean;
    recentEmotionDetected: boolean;
  };
}

