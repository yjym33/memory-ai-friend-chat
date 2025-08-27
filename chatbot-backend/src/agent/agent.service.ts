import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emotion, EmotionType } from './entities/emotion.entity';
import { Goal, GoalStatus, GoalCategory } from './entities/goal.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';
import { Conversation } from '../chat/entity/conversation.entity';
import { AgentState, AgentAction } from './types/agent-state';
import axios from 'axios';

@Injectable()
export class AgentService {
  constructor(
    @InjectRepository(Emotion)
    private emotionRepository: Repository<Emotion>,
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    @InjectRepository(AiSettings)
    private aiSettingsRepository: Repository<AiSettings>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
  ) {}

  async processMessage(userId: string, message: string): Promise<string> {
    console.log(`[Agent] Processing message for user ${userId}: "${message}"`);

    // 1. 에이전트 상태 초기화
    const agentState: AgentState = {
      userId,
      currentMessage: message,
      detectedEmotions: [],
      extractedGoals: [],
      recentEmotions: [],
      activeGoals: [],
      actions: [],
      shouldFollowUp: false,
      needsGoalCheck: false,
      needsEmotionSupport: false,
    };

    // 2. 워크플로우 실행
    await this.loadUserContext(agentState);
    await this.analyzeEmotion(agentState);
    await this.extractGoals(agentState);
    await this.checkFollowUp(agentState);

    let response = '';
    if (agentState.shouldFollowUp) {
      response = await this.generateSupport(agentState);
    }

    // 🌟 감정/목표가 없으면 LLM(OpenAI) 일반 답변 호출
    if (!response) {
      response = await this.getLLMGeneralResponse(userId, message);
    }

    // 3. 데이터베이스에 저장
    await this.saveAgentData(agentState);

    return response;
  }

  private async loadUserContext(state: AgentState): Promise<void> {
    console.log(`[Agent] Loading context for user ${state.userId}`);

    // 최근 감정 데이터 로드 (최근 7일)
    const recentEmotions = await this.emotionRepository.find({
      where: { userId: state.userId },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    state.recentEmotions = recentEmotions.map((e) => ({
      type: e.type,
      intensity: e.intensity,
      createdAt: e.createdAt,
    }));

    // 활성 목표 로드
    const activeGoals = await this.goalRepository.find({
      where: { userId: state.userId, status: GoalStatus.ACTIVE },
      order: { priority: 'DESC' },
    });

    state.activeGoals = activeGoals.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      status: g.status,
      progress: g.progress,
      lastCheckedAt: g.lastCheckedAt,
    }));

    state.actions.push({
      type: 'emotion_track',
      data: {
        step: 'context_loaded',
        emotionsCount: recentEmotions.length,
        goalsCount: activeGoals.length,
      },
      timestamp: new Date(),
    });
  }

  private async analyzeEmotion(state: AgentState): Promise<void> {
    console.log(
      `[Agent] Analyzing emotion in message: "${state.currentMessage}"`,
    );

    const emotionResult = this.performEmotionAnalysis(state.currentMessage);
    state.detectedEmotions = emotionResult.emotions;

    // 높은 강도의 부정적 감정 체크
    state.needsEmotionSupport = emotionResult.emotions.some(
      (e) =>
        (e.type === EmotionType.SAD ||
          e.type === EmotionType.ANXIOUS ||
          e.type === EmotionType.STRESSED) &&
        e.intensity >= 7,
    );

    state.actions.push({
      type: 'emotion_track',
      data: emotionResult,
      timestamp: new Date(),
    });
  }

  private async extractGoals(state: AgentState): Promise<void> {
    console.log(
      `[Agent] Extracting goals from message: "${state.currentMessage}"`,
    );

    const goalResult = this.performGoalExtraction(state.currentMessage);
    state.extractedGoals = goalResult.goals;
    state.needsGoalCheck = goalResult.goals.length > 0;

    state.actions.push({
      type: 'goal_extract',
      data: goalResult,
      timestamp: new Date(),
    });
  }

  private async checkFollowUp(state: AgentState): Promise<void> {
    console.log(`[Agent] Checking follow-up needs`);

    state.shouldFollowUp = state.needsEmotionSupport || state.needsGoalCheck;

    state.actions.push({
      type: 'follow_up',
      data: {
        shouldFollowUp: state.shouldFollowUp,
        needsSupport: state.needsEmotionSupport,
      },
      timestamp: new Date(),
    });
  }

  private async generateSupport(state: AgentState): Promise<string> {
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
        case EmotionType.ANGRY:
          followUpMessage +=
            '화가 나시는 상황인 것 같아요. 잠시 심호흡을 하고 진정해보세요. 🌬️';
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
        case GoalCategory.EDUCATION:
          followUpMessage +=
            '학습 목표군요! 꾸준히 하는 것이 가장 중요해요. 화이팅!';
          break;
        default:
          followUpMessage += '이 목표를 위해 어떤 계획을 세우고 계신가요?';
      }
    }

    state.actions.push({
      type: 'support',
      data: { message: followUpMessage },
      timestamp: new Date(),
    });

    return followUpMessage;
  }

  private performEmotionAnalysis(message: string): {
    emotions: { type: EmotionType; intensity: number; confidence: number }[];
  } {
    const emotionKeywords = {
      [EmotionType.HAPPY]: [
        '기쁘',
        '행복',
        '좋',
        '즐거',
        '웃',
        '신나',
        '최고',
        '완벽',
        '사랑',
        '감사',
      ],
      [EmotionType.SAD]: [
        '슬프',
        '우울',
        '힘들',
        '괴로',
        '눈물',
        '울',
        '외로',
        '허무',
        '절망',
      ],
      [EmotionType.ANGRY]: [
        '화',
        '짜증',
        '분노',
        '열받',
        '빡치',
        '미치',
        '답답',
        '억울',
      ],
      [EmotionType.ANXIOUS]: [
        '불안',
        '걱정',
        '초조',
        '떨리',
        '두려',
        '무서',
        '긴장',
        '조급',
      ],
      [EmotionType.STRESSED]: [
        '스트레스',
        '피곤',
        '지친',
        '힘든',
        '부담',
        '압박',
        '바쁘',
        '복잡',
      ],
      [EmotionType.EXCITED]: [
        '신나',
        '흥미',
        '기대',
        '설레',
        '재미',
        '즐거',
        '활기',
      ],
      [EmotionType.FRUSTRATED]: [
        '답답',
        '막막',
        '짜증',
        '어려',
        '복잡',
        '헷갈',
      ],
      [EmotionType.CALM]: ['평온', '차분', '안정', '편안', '고요', '평화'],
    };

    const emotions = [];

    for (const [emotionType, keywords] of Object.entries(emotionKeywords)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          emotions.push({
            type: emotionType as EmotionType,
            intensity: Math.floor(Math.random() * 4) + 7, // 7-10 범위 (감지된 경우 높은 강도)
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

  private performGoalExtraction(message: string): {
    goals: { title: string; category: GoalCategory; priority: number }[];
    isUpdate: boolean;
  } {
    const goalKeywords = {
      [GoalCategory.HEALTH]: [
        '다이어트',
        '운동',
        '건강',
        '체중',
        '헬스',
        '요가',
        '달리기',
        '수영',
        '금연',
        '금주',
      ],
      [GoalCategory.CAREER]: [
        '취업',
        '이직',
        '승진',
        '개발',
        '프로그래밍',
        '자격증',
        '면접',
        '회사',
        '직장',
      ],
      [GoalCategory.EDUCATION]: [
        '공부',
        '시험',
        '학습',
        '책',
        '강의',
        '교육',
        '대학',
        '학교',
        '과제',
        '연구',
        '독서',
        '읽기',
        '배우',
        '언어',
        '프로그래밍',
      ],
      [GoalCategory.RELATIONSHIP]: [
        '연애',
        '결혼',
        '친구',
        '가족',
        '관계',
        '데이트',
        '소개팅',
        '만남',
      ],
      [GoalCategory.FINANCE]: [
        '돈',
        '저축',
        '투자',
        '부업',
        '경제',
        '재정',
        '용돈',
        '월급',
        '수입',
        '여행',
        '자금',
        '모으',
      ],
      [GoalCategory.HOBBY]: [
        '취미',
        '여행',
        '음악',
        '그림',
        '사진',
        '요리',
        '독서',
        '게임',
      ],
    };

    const goals = [];

    // 목표 패턴 검사
    const goalPatterns = [
      /(.+)할\s*거야/g,
      /(.+)하려고\s*해/g,
      /(.+)해야지/g,
      /(.+)하겠어/g,
      /(.+)시작할\s*거야/g,
      /(.+)도전해볼게/g,
      /(.+)계획이야/g,
      /(.+)하고\s*싶어/g,
      /(.+)목표예요/g,
      /(.+)목표야/g,
      /(.+)목표입니다/g,
      /(.+)하는\s*것이\s*목표/g,
      /(.+)을\s*목표로/g,
      /(.+)를\s*목표로/g,
      /(.+)하자/g,
      /(.+)해보자/g,
      /(.+)만들고\s*싶어/g,
      /(.+)배우고\s*싶어/g,
    ];

    for (const pattern of goalPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        for (const match of matches) {
          let category = GoalCategory.PERSONAL;
          let priority = 5;

          // 카테고리 추론
          for (const [cat, keywords] of Object.entries(goalKeywords)) {
            if (keywords.some((keyword) => match.includes(keyword))) {
              category = cat as GoalCategory;
              priority =
                category === GoalCategory.HEALTH ||
                category === GoalCategory.CAREER
                  ? 8
                  : 6;
              break;
            }
          }

          goals.push({
            title: match.trim(),
            category,
            priority,
          });
        }
      }
    }

    return {
      goals,
      isUpdate: false,
    };
  }

  private async saveAgentData(state: AgentState): Promise<void> {
    try {
      // 감정 데이터 저장
      for (const emotion of state.detectedEmotions) {
        await this.emotionRepository.save({
          userId: state.userId,
          type: emotion.type,
          intensity: emotion.intensity,
          context: state.currentMessage,
        });
      }

      // 목표 데이터 저장
      for (const goal of state.extractedGoals) {
        await this.goalRepository.save({
          userId: state.userId,
          title: goal.title,
          category: goal.category,
          priority: goal.priority,
          status: GoalStatus.ACTIVE,
          progress: 0,
        });
      }

      console.log(
        `[Agent] Saved ${state.detectedEmotions.length} emotions and ${state.extractedGoals.length} goals`,
      );
    } catch (error) {
      console.error('[Agent] Error saving agent data:', error);
    }
  }

  async getAgentStatus(userId: string): Promise<{
    recentEmotions: any[];
    activeGoals: any[];
    emotionSummary: any;
    goalProgress: any;
  }> {
    // 최근 감정 데이터
    const recentEmotions = await this.emotionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // 활성 목표
    const activeGoals = await this.goalRepository.find({
      where: { userId, status: GoalStatus.ACTIVE },
      order: { priority: 'DESC' },
    });

    // 감정 요약 (최근 7일)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const emotionSummary = await this.emotionRepository
      .createQueryBuilder('emotion')
      .select('emotion.type', 'type')
      .addSelect('AVG(emotion.intensity)', 'avgIntensity')
      .addSelect('COUNT(*)', 'count')
      .where('emotion.userId = :userId', { userId })
      .andWhere('emotion.createdAt >= :weekAgo', { weekAgo })
      .groupBy('emotion.type')
      .getRawMany();

    // 목표 진행률 요약
    const goalProgress = {
      total: activeGoals.length,
      completed: activeGoals.filter((g) => g.progress >= 100).length,
      inProgress: activeGoals.filter((g) => g.progress > 0 && g.progress < 100)
        .length,
      notStarted: activeGoals.filter((g) => g.progress === 0).length,
    };

    return {
      recentEmotions,
      activeGoals,
      emotionSummary,
      goalProgress,
    };
  }

  // OpenAI GPT-4로 일반 답변 생성 (AI 설정 적용)
  private async getLLMGeneralResponse(
    userId: string,
    message: string,
  ): Promise<string> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return 'AI 시스템 오류: OpenAI API 키가 없습니다.';

      // 🔥 AI 설정 불러오기
      const aiSettings = await this.getAiSettings(userId);

      // 🧠 대화 히스토리 불러오기 (기억 관리)
      const conversationHistory = await this.getRecentConversationHistory(
        userId,
        aiSettings.memoryRetentionDays,
      );

      const systemPrompt = this.generateSystemPromptWithMemory(
        aiSettings,
        conversationHistory,
      );

      console.log(`🤖 AI 설정이 적용된 시스템 프롬프트:`, systemPrompt);

      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: message },
          ],
          temperature: 0.8,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return (
        res.data.choices?.[0]?.message?.content?.trim() ||
        '응답 생성에 실패했어. 다시 한 번 말해줄래?'
      );
    } catch (e) {
      console.error('[OpenAI] 일반 답변 생성 오류:', e);
      return '죄송해요, 답변을 생성하는 데 문제가 발생했어요.';
    }
  }

  /**
   * 사용자의 AI 설정을 가져옵니다.
   * @param userId - 사용자 ID
   * @returns AI 설정 객체
   */
  private async getAiSettings(userId: string): Promise<AiSettings> {
    let settings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    // 설정이 없으면 기본값으로 생성
    if (!settings) {
      console.log(
        `🔧 사용자 ${userId}의 AI 설정이 없어서 기본값으로 생성합니다.`,
      );
      settings = this.aiSettingsRepository.create({
        userId,
        personalityType: '친근함',
        speechStyle: '반말',
        emojiUsage: 3,
        empathyLevel: 3,
        memoryRetentionDays: 90,
        memoryPriorities: { personal: 5, hobby: 4, work: 3, emotion: 5 },
        userProfile: { interests: [], currentGoals: [], importantDates: [] },
        avoidTopics: [],
      });
      settings = await this.aiSettingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * AI 설정을 기반으로 시스템 프롬프트를 생성합니다.
   * @param settings - AI 설정
   * @returns 시스템 프롬프트
   */
  private generateSystemPrompt(settings: AiSettings): string {
    let prompt = `너는 AI 친구이다. 다음 설정에 따라 대화해야 한다:\n\n`;

    // 성격 타입
    if (settings.personalityType) {
      const personalityMap = {
        친근함: '따뜻하고 친근한 성격으로 대화한다',
        유머러스: '유머러스하고 재미있는 성격으로 대화한다',
        지적: '지적이고 논리적인 성격으로 대화한다',
        차분함: '차분하고 안정적인 성격으로 대화한다',
        활발함: '활발하고 에너지 넘치는 성격으로 대화한다',
      };
      prompt += `- 성격: ${personalityMap[settings.personalityType] || settings.personalityType}\n`;
    }

    // 말투
    if (settings.speechStyle) {
      const styleMap = {
        반말: '친근한 반말로 대화한다',
        존댓말: '정중한 존댓말로 대화한다',
        중성: '자연스럽고 중성적인 말투로 대화한다',
      };
      prompt += `- 말투: ${styleMap[settings.speechStyle] || settings.speechStyle}\n`;
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
   * 최근 대화 히스토리를 가져옵니다 (기억 관리).
   * @param userId - 사용자 ID
   * @param retentionDays - 기억 보존 일수
   * @returns 최근 대화 내용
   */
  private async getRecentConversationHistory(
    userId: string,
    retentionDays: number,
  ): Promise<string[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const conversations = await this.conversationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 10, // 최근 10개 대화만
      });

      const memories: string[] = [];

      for (const conversation of conversations) {
        if (conversation.createdAt >= cutoffDate && conversation.messages) {
          // 최근 메시지들에서 중요한 정보 추출
          const messages = conversation.messages as any[];
          for (const msg of messages.slice(-5)) {
            // 각 대화의 마지막 5개 메시지만
            if (msg.content && msg.content.length > 10) {
              memories.push(
                `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`,
              );
            }
          }
        }
      }

      console.log(
        `🧠 사용자 ${userId}의 기억 정보 ${memories.length}개 로드됨`,
      );
      return memories.slice(0, 20); // 최대 20개의 기억만 유지
    } catch (error) {
      console.error('대화 히스토리 로드 오류:', error);
      return [];
    }
  }

  /**
   * AI 설정과 기억을 포함한 시스템 프롬프트를 생성합니다.
   * @param settings - AI 설정
   * @param memories - 대화 기억
   * @returns 시스템 프롬프트
   */
  private generateSystemPromptWithMemory(
    settings: AiSettings,
    memories: string[],
  ): string {
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
   * 기억 우선순위에 따라 메모리를 정렬합니다.
   * @param memories - 원본 기억들
   * @param priorities - 기억 우선순위 설정
   * @returns 우선순위가 적용된 기억들
   */
  private prioritizeMemories(memories: string[], priorities: any): string[] {
    const priorityKeywords = {
      personal: [
        '이름',
        '나이',
        '직업',
        '가족',
        '개인',
        '취미',
        '좋아',
        '싫어',
      ],
      emotion: [
        '기쁘',
        '슬프',
        '화',
        '불안',
        '걱정',
        '스트레스',
        '행복',
        '우울',
      ],
      work: ['회사', '직장', '업무', '일', '프로젝트', '동료', '상사', '면접'],
      hobby: ['취미', '관심사', '좋아하는', '즐기는', '하고싶은'],
    };

    return memories.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      for (const [category, keywords] of Object.entries(priorityKeywords)) {
        const priority = priorities[category] || 3;

        const matchesA = keywords.filter((keyword) =>
          a.includes(keyword),
        ).length;
        const matchesB = keywords.filter((keyword) =>
          b.includes(keyword),
        ).length;

        scoreA += matchesA * priority;
        scoreB += matchesB * priority;
      }

      return scoreB - scoreA;
    });
  }
}
