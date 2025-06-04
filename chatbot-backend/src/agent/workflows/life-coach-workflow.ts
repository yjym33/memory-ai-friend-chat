import {
  AgentState,
  EmotionAnalysisResult,
  GoalExtractionResult,
} from '../types/agent-state';
import { EmotionType } from '../entities/emotion.entity';
import { GoalCategory } from '../entities/goal.entity';

export class LifeCoachWorkflow {
  private async loadUserContext(
    state: AgentState,
  ): Promise<Partial<AgentState>> {
    console.log(`[Agent] Loading context for user ${state.userId}`);
    return {
      actions: [
        ...state.actions,
        {
          type: 'emotion_track',
          data: { step: 'context_loaded' },
          timestamp: new Date(),
        },
      ],
    };
  }

  private async analyzeEmotion(
    state: AgentState,
  ): Promise<Partial<AgentState>> {
    console.log(
      `[Agent] Analyzing emotion in message: "${state.currentMessage}"`,
    );
    const emotionResult = this.performEmotionAnalysis(state.currentMessage);
    return {
      detectedEmotions: emotionResult.emotions,
      needsEmotionSupport: emotionResult.emotions.some(
        (e) =>
          (e.type === EmotionType.SAD ||
            e.type === EmotionType.ANXIOUS ||
            e.type === EmotionType.STRESSED) &&
          e.intensity >= 7,
      ),
      actions: [
        ...state.actions,
        {
          type: 'emotion_track',
          data: emotionResult,
          timestamp: new Date(),
        },
      ],
    };
  }

  private async extractGoals(state: AgentState): Promise<Partial<AgentState>> {
    console.log(
      `[Agent] Extracting goals from message: "${state.currentMessage}"`,
    );
    const goalResult = this.performGoalExtraction(state.currentMessage);
    return {
      extractedGoals: goalResult.goals,
      needsGoalCheck: goalResult.goals.length > 0,
      actions: [
        ...state.actions,
        {
          type: 'goal_extract',
          data: goalResult,
          timestamp: new Date(),
        },
      ],
    };
  }

  private async checkFollowUp(state: AgentState): Promise<Partial<AgentState>> {
    console.log(`[Agent] Checking follow-up needs`);
    return {
      shouldFollowUp: state.needsEmotionSupport || state.needsGoalCheck,
      actions: [
        ...state.actions,
        {
          type: 'follow_up',
          data: {
            shouldFollowUp: state.needsEmotionSupport || state.needsGoalCheck,
            needsSupport: state.needsEmotionSupport,
          },
          timestamp: new Date(),
        },
      ],
    };
  }

  private async generateSupport(
    state: AgentState,
  ): Promise<Partial<AgentState>> {
    console.log(`[Agent] Generating support response`);
    let followUpMessage = '';

    if (state.needsEmotionSupport && state.detectedEmotions.length > 0) {
      const emotion = state.detectedEmotions[0];
      followUpMessage += `💙 `;

      switch (emotion.type) {
        case EmotionType.SAD:
          followUpMessage +=
            '힘든 시간을 겪고 계시는 것 같아요. 언제든 이야기하고 싶으시면 들어드릴게요. 🤗';
          break;
        case EmotionType.ANXIOUS:
          followUpMessage +=
            '불안하신 마음이 느껴져요. 깊게 숨을 쉬고 천천히 생각해보시는 건 어떨까요? 🌸';
          break;
        case EmotionType.STRESSED:
          followUpMessage +=
            '많은 스트레스를 받고 계시는군요. 잠시 휴식을 취하시는 것도 좋겠어요. ☕';
          break;
        default:
          followUpMessage +=
            '제가 여기 있으니 걱정하지 마세요. 언제든 편하게 말씀해주세요. 😊';
      }
    }

    if (state.needsGoalCheck && state.extractedGoals.length > 0) {
      const goal = state.extractedGoals[0];
      followUpMessage += followUpMessage ? '\n\n' : '';
      followUpMessage += `🎯 "${goal.title}" 목표를 새로 설정하신 것 같네요! `;

      switch (goal.category) {
        case GoalCategory.HEALTH:
          followUpMessage +=
            '건강 목표는 정말 중요해요. 작은 변화부터 시작해보시는 건 어떨까요?';
          break;
        case GoalCategory.CAREER:
          followUpMessage +=
            '커리어 목표네요! 구체적인 계획을 세우면 더 도움이 될 것 같아요.';
          break;
        default:
          followUpMessage += '이 목표를 위해 어떤 계획을 세우고 계신가요?';
      }
    }

    return {
      followUpMessage,
      actions: [
        ...state.actions,
        {
          type: 'support',
          data: { message: followUpMessage },
          timestamp: new Date(),
        },
      ],
    };
  }

  private performEmotionAnalysis(message: string): EmotionAnalysisResult {
    const emotionKeywords = {
      [EmotionType.HAPPY]: ['기쁘', '행복', '좋', '즐거', '웃', '신나'],
      [EmotionType.SAD]: ['슬프', '우울', '힘들', '괴로', '눈물', '울'],
      [EmotionType.ANGRY]: ['화', '짜증', '분노', '열받', '빡치'],
      [EmotionType.ANXIOUS]: ['불안', '걱정', '초조', '떨리', '두려'],
      [EmotionType.STRESSED]: ['스트레스', '피곤', '지친', '힘든', '부담'],
      [EmotionType.EXCITED]: ['신나', '흥미', '기대', '설레'],
    };

    const emotions = [];

    for (const [emotionType, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          emotions.push({
            type: emotionType as EmotionType,
            intensity: Math.floor(Math.random() * 5) + 6,
            confidence: 0.8,
          });
          break;
        }
      }
    }

    if (emotions.length === 0) {
      emotions.push({
        type: EmotionType.CALM,
        intensity: 5,
        confidence: 0.5,
      });
    }

    return { emotions };
  }

  private performGoalExtraction(message: string): GoalExtractionResult {
    const goalKeywords = {
      [GoalCategory.HEALTH]: [
        '다이어트',
        '운동',
        '건강',
        '체중',
        '헬스',
        '요가',
      ],
      [GoalCategory.CAREER]: ['취업', '이직', '승진', '개발', '공부', '자격증'],
      [GoalCategory.EDUCATION]: ['공부', '시험', '학습', '책', '강의', '교육'],
      [GoalCategory.RELATIONSHIP]: ['연애', '결혼', '친구', '가족', '관계'],
      [GoalCategory.FINANCE]: ['돈', '저축', '투자', '부업', '경제', '재정'],
    };

    const goals = [];
    const goalPatterns = [
      /(.+)할\s*거야/g,
      /(.+)하려고\s*해/g,
      /(.+)해야지/g,
      /(.+)하겠어/g,
      /(.+)시작할\s*거야/g,
    ];

    for (const pattern of goalPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        for (const match of matches) {
          let category = GoalCategory.PERSONAL;
          for (const [cat, keywords] of Object.entries(goalKeywords)) {
            if (keywords.some((keyword) => match.includes(keyword))) {
              category = cat as GoalCategory;
              break;
            }
          }

          goals.push({
            title: match.trim(),
            category,
            priority: 5,
          });
        }
      }
    }

    return {
      goals,
      isUpdate: false,
    };
  }

  public async execute(
    initialState: Partial<AgentState>,
  ): Promise<Partial<AgentState>> {
    let state = { ...initialState } as AgentState;

    // 워크플로우 실행
    const contextResult = await this.loadUserContext(state);
    state = { ...state, ...contextResult };

    const emotionResult = await this.analyzeEmotion(state);
    state = { ...state, ...emotionResult };

    const goalResult = await this.extractGoals(state);
    state = { ...state, ...goalResult };

    const followUpResult = await this.checkFollowUp(state);
    state = { ...state, ...followUpResult };

    if (state.shouldFollowUp) {
      const supportResult = await this.generateSupport(state);
      state = { ...state, ...supportResult };
    }

    return state;
  }
}
