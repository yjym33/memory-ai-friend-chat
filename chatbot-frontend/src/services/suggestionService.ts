import axios from 'axios';

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
  priority: number;
  reason?: string;
}

/**
 * 추천 질문 응답 인터페이스
 */
export interface SuggestionResponse {
  success: boolean;
  suggestions: SuggestedQuestion[];
  context?: {
    timeOfDay: string;
    season: string;
    hasActiveGoals: boolean;
    recentEmotionDetected: boolean;
  };
}

/**
 * 추천 질문 API 서비스
 */
export const SuggestionService = {
  /**
   * 사용자 맞춤 추천 질문을 가져옵니다
   * @returns 추천 질문 배열
   */
  async getSuggestions(): Promise<SuggestionResponse> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // 토큰이 없으면 기본 추천 질문 반환
        return {
          success: true,
          suggestions: this.getDefaultSuggestions(),
        };
      }

      const response = await axios.get<SuggestionResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/agent/suggestions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('추천 질문 불러오기 실패:', error);
      
      // 에러 시 기본 추천 질문 반환
      return {
        success: true,
        suggestions: this.getDefaultSuggestions(),
      };
    }
  },

  /**
   * 기본 추천 질문 (로그인 전 또는 에러 시)
   */
  getDefaultSuggestions(): SuggestedQuestion[] {
    const hour = new Date().getHours();
    
    // 시간대별 기본 질문
    const timeBasedQuestion: SuggestedQuestion = 
      hour < 12
        ? { id: 'default-morning', text: '오늘 하루 계획이 있어?', emoji: '🌅', category: 'general', priority: 3 }
        : hour < 17
          ? { id: 'default-afternoon', text: '오늘 오후는 어때?', emoji: '☀️', category: 'general', priority: 3 }
          : hour < 21
            ? { id: 'default-evening', text: '오늘 하루 어땠어?', emoji: '🌙', category: 'emotion', priority: 3 }
            : { id: 'default-night', text: '오늘 하루 수고했어!', emoji: '✨', category: 'emotion', priority: 3 };

    return [
      timeBasedQuestion,
      { id: 'default-1', text: '오늘 기분이 어때?', emoji: '💭', category: 'emotion', priority: 5 },
      { id: 'default-2', text: '새로운 목표를 세워볼까?', emoji: '🎯', category: 'goal', priority: 4 },
      { id: 'default-3', text: '귀여운 그림 그려줘', emoji: '🎨', category: 'image', priority: 3 },
      { id: 'default-4', text: '스트레스 해소법 알려줘', emoji: '🧘', category: 'emotion', priority: 3 },
      { id: 'default-5', text: '재미있는 이야기 해줘', emoji: '📖', category: 'general', priority: 2 },
    ];
  },
};

