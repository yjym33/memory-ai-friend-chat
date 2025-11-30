import { Injectable, Logger } from '@nestjs/common';
import { AiSettings } from '../../ai-settings/entity/ai-settings.entity';
import {
  MemoryPriorities,
  ActiveGoal,
  DetectedEmotion,
} from '../types/agent-state';

/**
 * 프롬프트 컨텍스트 인터페이스
 */
export interface PromptContext {
  emotions?: DetectedEmotion[];
  goals?: ActiveGoal[];
  [key: string]: unknown;
}

/**
 * 동적 프롬프트 컨텍스트 인터페이스
 */
export interface DynamicPromptContext {
  currentEmotion?: string;
  activeGoals?: ActiveGoal[];
  recentTopics?: string[];
}

/**
 * Prompt Generator Service
 * AI 설정과 기억을 기반으로 시스템 프롬프트를 생성합니다.
 */
@Injectable()
export class PromptGeneratorService {
  private readonly logger = new Logger(PromptGeneratorService.name);

  // 성격 타입 매핑
  private readonly personalityMap: Record<string, string> = {
    친근함: '따뜻하고 친근한 성격으로 대화한다',
    유머러스: '유머러스하고 재미있는 성격으로 대화한다',
    지적: '지적이고 논리적인 성격으로 대화한다',
    차분함: '차분하고 안정적인 성격으로 대화한다',
    활발함: '활발하고 에너지 넘치는 성격으로 대화한다',
  };

  // 말투 매핑
  private readonly styleMap: Record<string, string> = {
    반말: '친근한 반말로 대화한다',
    존댓말: '정중한 존댓말로 대화한다',
    중성: '자연스럽고 중성적인 말투로 대화한다',
  };

  // 기억 우선순위 키워드
  private readonly priorityKeywords: Record<string, string[]> = {
    personal: ['이름', '나이', '직업', '가족', '개인', '취미', '좋아', '싫어'],
    emotion: ['기쁘', '슬프', '화', '불안', '걱정', '스트레스', '행복', '우울'],
    work: ['회사', '직장', '업무', '일', '프로젝트', '동료', '상사', '면접'],
    hobby: ['취미', '관심사', '좋아하는', '즐기는', '하고싶은'],
  };

  /**
   * AI 설정 기반 시스템 프롬프트를 생성합니다
   * @param settings - AI 설정
   * @returns 시스템 프롬프트
   */
  generateSystemPrompt(settings: AiSettings): string {
    let prompt = `너는 AI 친구이다. 다음 설정에 따라 대화해야 한다:\n\n`;

    // 성격 타입
    if (settings.personalityType) {
      const personalityDesc =
        this.personalityMap[settings.personalityType] || settings.personalityType;
      prompt += `- 성격: ${personalityDesc}\n`;
    }

    // 말투
    if (settings.speechStyle) {
      const styleDesc = this.styleMap[settings.speechStyle] || settings.speechStyle;
      prompt += `- 말투: ${styleDesc}\n`;
    }

    // 이모지 사용
    if (settings.emojiUsage !== undefined) {
      if (settings.emojiUsage >= 4) {
        prompt += `- 이모지를 자주 사용하여 표현력을 높인다\n`;
      } else if (settings.emojiUsage >= 2) {
        prompt += `- 적절히 이모지를 사용한다\n`;
      } else {
        prompt += `- 이모지 사용을 최소화한다\n`;
      }
    }

    // 공감 수준
    if (settings.empathyLevel !== undefined) {
      if (settings.empathyLevel >= 4) {
        prompt += `- 매우 공감적이고 감정적 지지를 많이 제공한다\n`;
      } else if (settings.empathyLevel >= 2) {
        prompt += `- 적절한 수준의 공감과 지지를 제공한다\n`;
      } else {
        prompt += `- 논리적이고 객관적인 관점을 더 중시한다\n`;
      }
    }

    // 닉네임
    if (settings.nickname) {
      prompt += `- 사용자를 "${settings.nickname}"라고 부른다\n`;
    }

    // 관심사 반영
    if (settings.userProfile?.interests?.length > 0) {
      prompt += `- 사용자의 관심사: ${settings.userProfile.interests.join(', ')}\n`;
    }

    // 피해야 할 주제
    if (settings.avoidTopics?.length > 0) {
      prompt += `- 피해야 할 주제: ${settings.avoidTopics.join(', ')}\n`;
    }

    prompt += `\n응답은 자연스럽고 일관성 있게 작성해야 한다.`;

    return prompt;
  }

  /**
   * 기억이 포함된 시스템 프롬프트를 생성합니다
   * @param settings - AI 설정
   * @param memories - 대화 기억
   * @returns 시스템 프롬프트
   */
  generatePromptWithMemory(settings: AiSettings, memories: string[]): string {
    let prompt = this.generateSystemPrompt(settings);

    // 기억 정보 추가
    if (memories.length > 0) {
      prompt += `\n\n📝 이전 대화에서 기억해야 할 내용:\n`;

      // 우선순위에 따라 기억 필터링
      const prioritizedMemories = this.prioritizeMemories(
        memories,
        settings.memoryPriorities,
      );

      for (let i = 0; i < Math.min(prioritizedMemories.length, 10); i++) {
        prompt += `- ${prioritizedMemories[i]}\n`;
      }

      prompt += `\n위 내용들을 참고하여 일관성 있는 대화를 이어가되, 자연스럽게 언급하세요.`;
    }

    return prompt;
  }

  /**
   * 기억 우선순위에 따라 메모리를 정렬합니다
   * @param memories - 원본 기억들
   * @param priorities - 기억 우선순위 설정
   * @returns 우선순위가 적용된 기억들
   */
  private prioritizeMemories(
    memories: string[],
    priorities: MemoryPriorities | null | undefined,
  ): string[] {
    return memories.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      for (const [category, keywords] of Object.entries(this.priorityKeywords)) {
        const priority = priorities?.[category] ?? 3;
        const keywordList = keywords as string[];

        const matchesA = keywordList.filter((keyword) =>
          a.includes(keyword),
        ).length;
        const matchesB = keywordList.filter((keyword) =>
          b.includes(keyword),
        ).length;

        scoreA += matchesA * priority;
        scoreB += matchesB * priority;
      }

      return scoreB - scoreA;
    });
  }

  /**
   * 특정 목적을 위한 시스템 프롬프트를 생성합니다
   * @param purpose - 프롬프트 목적
   * @param context - 추가 컨텍스트
   * @returns 시스템 프롬프트
   */
  generatePurposePrompt(
    purpose: 'emotion_support' | 'goal_tracking' | 'general',
    context?: PromptContext,
  ): string {
    switch (purpose) {
      case 'emotion_support':
        return this.generateEmotionSupportPrompt(context);
      case 'goal_tracking':
        return this.generateGoalTrackingPrompt(context);
      default:
        return this.generateGeneralPrompt();
    }
  }

  /**
   * 감정 지원을 위한 프롬프트를 생성합니다
   * @param context - 컨텍스트 정보
   * @returns 감정 지원 프롬프트
   */
  private generateEmotionSupportPrompt(context?: PromptContext): string {
    let prompt = `너는 공감적이고 지지적인 AI 친구이다.
사용자가 감정적으로 힘들어하고 있으니 다음 지침을 따라라:

1. 사용자의 감정을 인정하고 공감한다
2. 판단하지 않고 경청한다
3. 필요시 적절한 조언을 제공한다
4. 위로와 격려의 말을 건넨다
5. 전문적인 도움이 필요한 경우 상담 권유를 고려한다
`;

    if (context?.emotions) {
      prompt += `\n현재 감지된 감정: ${JSON.stringify(context.emotions)}\n`;
    }

    return prompt;
  }

  /**
   * 목표 추적을 위한 프롬프트를 생성합니다
   * @param context - 컨텍스트 정보
   * @returns 목표 추적 프롬프트
   */
  private generateGoalTrackingPrompt(context?: PromptContext): string {
    let prompt = `너는 목표 달성을 돕는 AI 코치이다.
사용자의 목표 달성을 지원하기 위해 다음 지침을 따라라:

1. 목표에 대한 격려와 동기부여를 제공한다
2. 진행 상황을 긍정적으로 평가한다
3. 구체적이고 실행 가능한 조언을 제공한다
4. 작은 성취도 인정하고 칭찬한다
5. 현실적인 기대치를 유지하면서 격려한다
`;

    if (context?.goals) {
      prompt += `\n현재 활성 목표: ${JSON.stringify(context.goals)}\n`;
    }

    return prompt;
  }

  /**
   * 일반 대화를 위한 프롬프트를 생성합니다
   * @returns 일반 대화 프롬프트
   */
  private generateGeneralPrompt(): string {
    return `너는 친절하고 도움이 되는 AI 친구이다.
자연스럽고 친근한 대화를 나누며, 사용자의 질문에 정확하고 유용한 답변을 제공한다.
필요한 경우 적절한 이모지를 사용하여 대화를 더 생동감 있게 만든다.`;
  }

  /**
   * 대화 컨텍스트를 기반으로 동적 프롬프트를 생성합니다
   * @param settings - AI 설정
   * @param memories - 대화 기억
   * @param additionalContext - 추가 컨텍스트
   * @returns 동적 시스템 프롬프트
   */
  generateDynamicPrompt(
    settings: AiSettings,
    memories: string[],
    additionalContext?: DynamicPromptContext,
  ): string {
    let prompt = this.generatePromptWithMemory(settings, memories);

    // 현재 감정 상태 추가
    if (additionalContext?.currentEmotion) {
      prompt += `\n\n🎭 현재 사용자 감정 상태: ${additionalContext.currentEmotion}`;
      prompt += `\n이 감정을 고려하여 공감적으로 응답하세요.`;
    }

    // 활성 목표 추가
    if (additionalContext?.activeGoals && additionalContext.activeGoals.length > 0) {
      prompt += `\n\n🎯 사용자의 활성 목표:`;
      additionalContext.activeGoals.forEach((goal) => {
        prompt += `\n- ${goal.title} (진행률: ${goal.progress}%)`;
      });
      prompt += `\n목표 관련 대화가 있으면 격려와 동기부여를 제공하세요.`;
    }

    // 최근 대화 주제 추가
    if (additionalContext?.recentTopics && additionalContext.recentTopics.length > 0) {
      prompt += `\n\n💬 최근 대화 주제: ${additionalContext.recentTopics.join(', ')}`;
      prompt += `\n이 주제들과 연관된 대화를 자연스럽게 이어갈 수 있습니다.`;
    }

    return prompt;
  }
}

