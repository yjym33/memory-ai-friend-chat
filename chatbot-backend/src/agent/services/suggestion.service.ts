import { Injectable, Logger } from '@nestjs/common';
import { EmotionType } from '../entities/emotion.entity';
import {
  SuggestedQuestion,
  SuggestionContext,
  TimeOfDay,
  Season,
} from '../types/suggestion.types';

/**
 * Suggestion Service
 * 사용자 컨텍스트(감정, 목표, 시간대, 계절)를 기반으로 동적 추천 질문을 생성합니다.
 */
@Injectable()
export class SuggestionService {
  private readonly logger = new Logger(SuggestionService.name);

  /**
   * 시간대별 기본 질문
   */
  private readonly timeBasedQuestions: Record<TimeOfDay, SuggestedQuestion[]> =
    {
      morning: [
        {
          id: 'morning-1',
          text: '오늘 하루 계획이 있어?',
          emoji: '🌅',
          category: 'general',
          priority: 3,
        },
        {
          id: 'morning-2',
          text: '어젯밤 잘 잤어?',
          emoji: '😴',
          category: 'emotion',
          priority: 2,
        },
        {
          id: 'morning-3',
          text: '아침 운동 같이 시작해볼까?',
          emoji: '🏃',
          category: 'goal',
          priority: 2,
        },
      ],
      afternoon: [
        {
          id: 'afternoon-1',
          text: '점심은 맛있게 먹었어?',
          emoji: '🍽️',
          category: 'general',
          priority: 2,
        },
        {
          id: 'afternoon-2',
          text: '오늘 오전은 어땠어?',
          emoji: '💭',
          category: 'emotion',
          priority: 3,
        },
        {
          id: 'afternoon-3',
          text: '오후에 할 일 정리해줄까?',
          emoji: '📋',
          category: 'goal',
          priority: 2,
        },
      ],
      evening: [
        {
          id: 'evening-1',
          text: '오늘 하루 어땠어?',
          emoji: '🌙',
          category: 'emotion',
          priority: 5,
        },
        {
          id: 'evening-2',
          text: '저녁 뭐 먹을지 추천해줄까?',
          emoji: '🍲',
          category: 'general',
          priority: 2,
        },
        {
          id: 'evening-3',
          text: '내일 계획 세워볼까?',
          emoji: '📆',
          category: 'goal',
          priority: 3,
        },
      ],
      night: [
        {
          id: 'night-1',
          text: '오늘 하루 수고했어!',
          emoji: '✨',
          category: 'emotion',
          priority: 4,
        },
        {
          id: 'night-2',
          text: '오늘 있었던 좋은 일 알려줘',
          emoji: '😊',
          category: 'general',
          priority: 3,
        },
        {
          id: 'night-3',
          text: '잠들기 전 명상 해볼까?',
          emoji: '🧘',
          category: 'emotion',
          priority: 2,
        },
      ],
    };

  /**
   * 감정 기반 질문 생성
   */
  generateEmotionBasedQuestions(emotions: string[]): SuggestedQuestion[] {
    const questions: SuggestedQuestion[] = [];

    // 스트레스 감지
    if (
      emotions.includes(EmotionType.STRESSED) ||
      emotions.includes('stressed')
    ) {
      questions.push({
        id: 'stress-1',
        text: '스트레스 해소법 알려줘',
        emoji: '🧘',
        category: 'emotion',
        priority: 5,
        reason: '최근 스트레스를 받으신 것 같아요',
      });
      questions.push({
        id: 'stress-2',
        text: '잠깐 쉬면서 음악 추천받을래?',
        emoji: '🎵',
        category: 'general',
        priority: 4,
        reason: '기분 전환이 필요해 보여요',
      });
    }

    // 슬픔 감지
    if (emotions.includes(EmotionType.SAD) || emotions.includes('sad')) {
      questions.push({
        id: 'sad-1',
        text: '기분 좋아지는 이야기 해줘',
        emoji: '💙',
        category: 'emotion',
        priority: 5,
        reason: '힘든 시간을 보내고 계신 것 같아요',
      });
      questions.push({
        id: 'sad-2',
        text: '위로가 되는 명언 알려줘',
        emoji: '💬',
        category: 'general',
        priority: 4,
        reason: '따뜻한 말이 필요할 것 같아요',
      });
    }

    // 불안 감지
    if (emotions.includes(EmotionType.ANXIOUS) || emotions.includes('anxious')) {
      questions.push({
        id: 'anxious-1',
        text: '마음 진정시키는 방법 알려줘',
        emoji: '🌿',
        category: 'emotion',
        priority: 5,
        reason: '마음이 불안해 보여요',
      });
    }

    // 분노 감지
    if (emotions.includes(EmotionType.ANGRY) || emotions.includes('angry')) {
      questions.push({
        id: 'angry-1',
        text: '화날 때 진정하는 방법 알려줘',
        emoji: '😤',
        category: 'emotion',
        priority: 5,
        reason: '화가 나신 것 같아요',
      });
    }

    // 행복 감지
    if (emotions.includes(EmotionType.HAPPY) || emotions.includes('happy')) {
      questions.push({
        id: 'happy-1',
        text: '오늘 좋은 일 있었어? 나도 알려줘!',
        emoji: '🎉',
        category: 'emotion',
        priority: 4,
        reason: '기분이 좋아 보여요!',
      });
    }

    // 흥분/설렘 감지
    if (
      emotions.includes(EmotionType.EXCITED) ||
      emotions.includes('excited')
    ) {
      questions.push({
        id: 'excited-1',
        text: '새로운 도전 추천해줘!',
        emoji: '🚀',
        category: 'goal',
        priority: 4,
        reason: '좋은 에너지가 느껴져요!',
      });
    }

    // 좌절 감지
    if (
      emotions.includes(EmotionType.FRUSTRATED) ||
      emotions.includes('frustrated')
    ) {
      questions.push({
        id: 'frustrated-1',
        text: '막막할 때 도움되는 조언 해줘',
        emoji: '💪',
        category: 'emotion',
        priority: 5,
        reason: '어려움을 겪고 계신 것 같아요',
      });
    }

    return questions;
  }

  /**
   * 목표 기반 질문 생성
   */
  generateGoalBasedQuestions(
    goals: { title: string; category: string; progress: number }[],
  ): SuggestedQuestion[] {
    const questions: SuggestedQuestion[] = [];

    for (const goal of goals.slice(0, 3)) {
      // 시작 단계 (0-30%)
      if (goal.progress < 30) {
        questions.push({
          id: `goal-start-${goal.title.substring(0, 10)}`,
          text: `${goal.title} 진행 상황 어때?`,
          emoji: '🎯',
          category: 'goal',
          priority: 4,
          reason: `'${goal.title}' 목표를 시작하셨네요!`,
        });
      }
      // 중간 단계 (30-70%)
      else if (goal.progress >= 30 && goal.progress < 70) {
        questions.push({
          id: `goal-mid-${goal.title.substring(0, 10)}`,
          text: `${goal.title} 잘 되고 있어?`,
          emoji: '📈',
          category: 'goal',
          priority: 4,
          reason: `'${goal.title}' 목표가 잘 진행되고 있어요!`,
        });
      }
      // 마무리 단계 (70-99%)
      else if (goal.progress >= 70 && goal.progress < 100) {
        questions.push({
          id: `goal-almost-${goal.title.substring(0, 10)}`,
          text: `${goal.title} 거의 다 됐어! 파이팅!`,
          emoji: '💪',
          category: 'goal',
          priority: 5,
          reason: `'${goal.title}' 목표 달성이 얼마 안 남았어요!`,
        });
      }
    }

    // 목표가 없을 때
    if (goals.length === 0) {
      questions.push({
        id: 'goal-new-1',
        text: '새로운 목표를 세워볼까?',
        emoji: '🎯',
        category: 'goal',
        priority: 3,
        reason: '목표를 세우면 더 알찬 하루가 될 거예요!',
      });
    }

    return questions;
  }

  /**
   * 계절별 질문 생성
   */
  getSeasonalQuestions(season: Season): SuggestedQuestion[] {
    const seasonalMap: Record<Season, SuggestedQuestion[]> = {
      spring: [
        {
          id: 'spring-1',
          text: '봄맞이 새로운 목표 세워볼까?',
          emoji: '🌸',
          category: 'seasonal',
          priority: 3,
        },
        {
          id: 'spring-2',
          text: '봄 나들이 계획 세워줄까?',
          emoji: '🌷',
          category: 'general',
          priority: 2,
        },
      ],
      summer: [
        {
          id: 'summer-1',
          text: '여름 휴가 계획 있어?',
          emoji: '🏖️',
          category: 'seasonal',
          priority: 3,
        },
        {
          id: 'summer-2',
          text: '시원한 음료 레시피 알려줄까?',
          emoji: '🍹',
          category: 'general',
          priority: 2,
        },
      ],
      autumn: [
        {
          id: 'autumn-1',
          text: '가을에 읽을 책 추천해줘',
          emoji: '📚',
          category: 'seasonal',
          priority: 3,
        },
        {
          id: 'autumn-2',
          text: '단풍 여행 추천해줄까?',
          emoji: '🍂',
          category: 'general',
          priority: 2,
        },
      ],
      winter: [
        {
          id: 'winter-1',
          text: '올해 연말 계획 있어?',
          emoji: '❄️',
          category: 'seasonal',
          priority: 3,
        },
        {
          id: 'winter-2',
          text: '새해 목표 세워볼까?',
          emoji: '🎊',
          category: 'goal',
          priority: 4,
        },
        {
          id: 'winter-3',
          text: '따뜻한 겨울 음식 추천해줘',
          emoji: '🍲',
          category: 'general',
          priority: 2,
        },
      ],
    };

    return seasonalMap[season] || [];
  }

  /**
   * 이미지 생성 관련 질문
   */
  getImageQuestions(): SuggestedQuestion[] {
    const imageQuestions: SuggestedQuestion[] = [
      {
        id: 'image-1',
        text: '귀여운 고양이 그림 그려줘',
        emoji: '🐱',
        category: 'image',
        priority: 2,
      },
      {
        id: 'image-2',
        text: '예쁜 풍경 이미지 만들어줘',
        emoji: '🏞️',
        category: 'image',
        priority: 2,
      },
      {
        id: 'image-3',
        text: '우주 배경 그림 그려줘',
        emoji: '🌌',
        category: 'image',
        priority: 2,
      },
      {
        id: 'image-4',
        text: '귀여운 캐릭터 만들어줘',
        emoji: '🎨',
        category: 'image',
        priority: 2,
      },
    ];

    // 랜덤으로 1개 선택
    return [imageQuestions[Math.floor(Math.random() * imageQuestions.length)]];
  }

  /**
   * 요일별 특별 질문 (월요일 블루, 금요일 설렘 등)
   */
  getDayOfWeekQuestions(dayOfWeek: number): SuggestedQuestion[] {
    const dayQuestions: SuggestedQuestion[] = [];

    switch (dayOfWeek) {
      case 0: // 일요일
        dayQuestions.push({
          id: 'day-sunday',
          text: '주말 잘 보내고 있어?',
          emoji: '☀️',
          category: 'general',
          priority: 2,
        });
        break;
      case 1: // 월요일
        dayQuestions.push({
          id: 'day-monday',
          text: '월요병 이겨내는 방법 알려줄까?',
          emoji: '💼',
          category: 'emotion',
          priority: 3,
        });
        break;
      case 5: // 금요일
        dayQuestions.push({
          id: 'day-friday',
          text: '불금! 주말 계획 있어?',
          emoji: '🎉',
          category: 'general',
          priority: 3,
        });
        break;
      case 6: // 토요일
        dayQuestions.push({
          id: 'day-saturday',
          text: '토요일 뭐하고 있어?',
          emoji: '🎊',
          category: 'general',
          priority: 2,
        });
        break;
    }

    return dayQuestions;
  }

  /**
   * 종합 추천 질문 생성
   */
  async generateSuggestions(
    context: SuggestionContext,
  ): Promise<SuggestedQuestion[]> {
    const allQuestions: SuggestedQuestion[] = [];

    this.logger.debug(
      `[Suggestion] Generating suggestions for context: ${JSON.stringify({
        timeOfDay: context.timeOfDay,
        season: context.season,
        emotionsCount: context.recentEmotions.length,
        goalsCount: context.activeGoals.length,
      })}`,
    );

    // 1. 시간대 기반 질문
    const timeQuestions = this.timeBasedQuestions[context.timeOfDay] || [];
    allQuestions.push(...timeQuestions);

    // 2. 감정 기반 질문
    if (context.recentEmotions.length > 0) {
      const emotionQuestions = this.generateEmotionBasedQuestions(
        context.recentEmotions,
      );
      allQuestions.push(...emotionQuestions);
    }

    // 3. 목표 기반 질문
    const goalQuestions = this.generateGoalBasedQuestions(context.activeGoals);
    allQuestions.push(...goalQuestions);

    // 4. 계절 기반 질문
    const seasonQuestions = this.getSeasonalQuestions(context.season);
    allQuestions.push(...seasonQuestions);

    // 5. 요일 기반 질문
    const dayQuestions = this.getDayOfWeekQuestions(context.dayOfWeek);
    allQuestions.push(...dayQuestions);

    // 6. 이미지 질문 (랜덤으로 1개)
    const imageQuestions = this.getImageQuestions();
    allQuestions.push(...imageQuestions);

    // 중복 제거 (ID 기준)
    const uniqueQuestions = allQuestions.filter(
      (question, index, self) =>
        index === self.findIndex((q) => q.id === question.id),
    );

    // 우선순위로 정렬 후 상위 6개만 반환
    const sortedQuestions = uniqueQuestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6);

    this.logger.debug(
      `[Suggestion] Generated ${sortedQuestions.length} suggestions`,
    );

    return sortedQuestions;
  }

  /**
   * 시간대 계산
   */
  getTimeOfDay(hour: number): TimeOfDay {
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  /**
   * 계절 계산
   */
  getSeason(month: number): Season {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }
}

