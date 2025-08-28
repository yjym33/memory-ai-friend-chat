import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Emotion, EmotionType } from './entities/emotion.entity';
import { Goal, GoalStatus, GoalCategory } from './entities/goal.entity';
import { Milestone, MilestoneStatus } from './entities/milestone.entity';
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
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
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

    // 새로운 목표를 관리 시스템에 자동 저장
    if (goalResult.goals.length > 0) {
      await this.saveNewGoals(state.userId, goalResult.goals);
    }

    // 기존 목표의 진행 상황 자동 감지
    await this.detectProgressUpdates(state.userId, state.currentMessage);

    state.actions.push({
      type: 'goal_extract',
      data: goalResult,
      timestamp: new Date(),
    });
  }

  // 진행 상황 자동 감지
  private async detectProgressUpdates(
    userId: string,
    message: string,
  ): Promise<void> {
    try {
      const activeGoals = await this.goalRepository.find({
        where: { userId, status: GoalStatus.ACTIVE },
        relations: ['milestones'],
      });

      for (const goal of activeGoals) {
        const progressUpdate = this.analyzeProgressMessage(message, goal);

        if (progressUpdate) {
          console.log(
            `[Agent] Progress detected for goal "${goal.title}": ${progressUpdate.amount}%`,
          );

          // 진행률 업데이트
          await this.updateGoalProgress(
            goal.id,
            goal.progress + progressUpdate.amount,
          );
        }
      }
    } catch (error) {
      console.error('[Agent] Error detecting progress updates:', error);
    }
  }

  // 메시지에서 진행 상황 분석
  private analyzeProgressMessage(
    message: string,
    goal: Goal,
  ): { amount: number; reason: string } | null {
    const lowerMessage = message.toLowerCase();

    // 진행 상황 키워드 패턴
    const progressPatterns = [
      // 운동 관련
      {
        pattern: /(운동|운동을|운동했|운동하고|운동 중|운동 시작|운동 계속)/,
        amount: 10,
        reason: '운동 활동',
      },
      {
        pattern: /(일주일|1주일|한 주|7일).*(운동|지속|계속)/,
        amount: 25,
        reason: '1주일 운동 지속',
      },
      {
        pattern: /(한 달|1개월|30일|월).*(운동|지속|계속)/,
        amount: 50,
        reason: '1개월 운동 지속',
      },
      {
        pattern: /(3개월|세 달|90일).*(운동|지속|계속)/,
        amount: 75,
        reason: '3개월 운동 지속',
      },

      // 학습 관련
      {
        pattern: /(공부|학습|배우|읽|책|강의|수업)/,
        amount: 10,
        reason: '학습 활동',
      },
      {
        pattern: /(기초|기본|입문).*(완료|끝|마치)/,
        amount: 30,
        reason: '기초 학습 완료',
      },
      {
        pattern: /(프로젝트|실습|실제).*(완료|끝|마치)/,
        amount: 60,
        reason: '실습 프로젝트 완료',
      },
      {
        pattern: /(포트폴리오|결과물|성과).*(완성|완료)/,
        amount: 90,
        reason: '포트폴리오 완성',
      },

      // 일반적인 진행 상황
      { pattern: /(시작|첫|처음)/, amount: 5, reason: '활동 시작' },
      { pattern: /(진행|계속|지속)/, amount: 15, reason: '활동 지속' },
      { pattern: /(중간|절반|50%)/, amount: 50, reason: '중간 진행' },
      { pattern: /(거의|거의 다|거의 완료)/, amount: 80, reason: '거의 완료' },
      { pattern: /(완료|끝|마치|달성|성공)/, amount: 100, reason: '목표 완료' },
    ];

    // 목표 카테고리별 특화 패턴
    const categorySpecificPatterns = this.getCategorySpecificProgressPatterns(
      goal.category,
    );
    const allPatterns = [...progressPatterns, ...categorySpecificPatterns];

    for (const pattern of allPatterns) {
      if (pattern.pattern.test(lowerMessage)) {
        return {
          amount: Math.min(pattern.amount, 100 - goal.progress), // 100%를 넘지 않도록
          reason: pattern.reason,
        };
      }
    }

    return null;
  }

  // 카테고리별 특화 진행 상황 패턴
  private getCategorySpecificProgressPatterns(category: GoalCategory): Array<{
    pattern: RegExp;
    amount: number;
    reason: string;
  }> {
    switch (category) {
      case GoalCategory.HEALTH:
        return [
          {
            pattern: /(다이어트|체중|몸무게).*(감량|줄이|빼)/,
            amount: 15,
            reason: '다이어트 진행',
          },
          { pattern: /(금연|금주|절주)/, amount: 20, reason: '건강 습관 개선' },
          {
            pattern: /(요가|명상|스트레칭)/,
            amount: 10,
            reason: '건강 관리 활동',
          },
        ];

      case GoalCategory.CAREER:
        return [
          {
            pattern: /(이력서|자기소개서).*(작성|완성)/,
            amount: 40,
            reason: '이력서 작성',
          },
          {
            pattern: /(면접|인터뷰).*(준비|연습)/,
            amount: 60,
            reason: '면접 준비',
          },
          {
            pattern: /(자격증|증명서).*(취득|획득)/,
            amount: 80,
            reason: '자격증 취득',
          },
        ];

      case GoalCategory.EDUCATION:
        return [
          {
            pattern: /(시험|테스트).*(합격|통과)/,
            amount: 70,
            reason: '시험 합격',
          },
          {
            pattern: /(과제|레포트).*(제출|완성)/,
            amount: 50,
            reason: '과제 완성',
          },
          {
            pattern: /(졸업|수료).*(증|서)/,
            amount: 100,
            reason: '교육 과정 완료',
          },
        ];

      case GoalCategory.FINANCE:
        return [
          {
            pattern: /(저축|적금).*(시작|가입)/,
            amount: 20,
            reason: '저축 시작',
          },
          {
            pattern: /(투자|주식|펀드).*(시작|가입)/,
            amount: 30,
            reason: '투자 시작',
          },
          {
            pattern: /(목표 금액|목표액).*(달성|모으)/,
            amount: 100,
            reason: '재정 목표 달성',
          },
        ];

      default:
        return [];
    }
  }

  // 새로운 목표를 관리 시스템에 저장 (중복 검사 포함)
  private async saveNewGoals(
    userId: string,
    goals: { title: string; category: GoalCategory; priority: number }[],
  ): Promise<void> {
    for (const goal of goals) {
      try {
        // 중복 검사 - 같은 제목의 활성 목표가 있는지 확인
        const existingGoal = await this.goalRepository.findOne({
          where: {
            userId,
            title: goal.title,
            status: GoalStatus.ACTIVE,
          },
        });

        if (!existingGoal) {
          // 새 목표 생성
          const newGoal = await this.goalRepository.save({
            userId,
            title: goal.title,
            category: goal.category,
            priority: goal.priority,
            status: GoalStatus.ACTIVE,
            progress: 0,
            createdAt: new Date(),
            lastCheckedAt: new Date(),
          });

          // 마일스톤 자동 생성
          await this.generateMilestones(newGoal.id, goal.category);

          console.log(
            `[Agent] New goal created: "${newGoal.title}" (ID: ${newGoal.id})`,
          );
        } else {
          console.log(
            `[Agent] Goal already exists: "${goal.title}" (ID: ${existingGoal.id})`,
          );
        }
      } catch (error) {
        console.error(`[Agent] Error saving goal "${goal.title}":`, error);
      }
    }
  }

  // 마일스톤 자동 생성
  private async generateMilestones(
    goalId: number,
    category: GoalCategory,
  ): Promise<void> {
    const milestones = this.getMilestoneTemplates(category);

    for (const milestone of milestones) {
      await this.milestoneRepository.save({
        goalId,
        title: milestone.title,
        description: milestone.description,
        targetProgress: milestone.targetProgress,
        targetDate: milestone.targetDate,
        priority: milestone.priority,
        status: MilestoneStatus.PENDING,
      });
    }
  }

  // 카테고리별 마일스톤 템플릿
  private getMilestoneTemplates(category: GoalCategory): Array<{
    title: string;
    description: string;
    targetProgress: number;
    targetDate: Date;
    priority: number;
  }> {
    const baseDate = new Date();

    switch (category) {
      case GoalCategory.HEALTH:
        return [
          {
            title: '첫 번째 운동 시작',
            description: '운동 습관을 만들기 위한 첫 걸음',
            targetProgress: 25,
            targetDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1주일 후
            priority: 1,
          },
          {
            title: '1개월 운동 지속',
            description: '꾸준한 운동 습관 형성',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1개월 후
            priority: 2,
          },
          {
            title: '3개월 운동 완료',
            description: '장기적인 건강 목표 달성',
            targetProgress: 75,
            targetDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 3개월 후
            priority: 3,
          },
        ];

      case GoalCategory.CAREER:
        return [
          {
            title: '기초 학습 완료',
            description: '기본 개념과 이론 학습',
            targetProgress: 30,
            targetDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2주일 후
            priority: 1,
          },
          {
            title: '실습 프로젝트 완료',
            description: '실제 적용 가능한 프로젝트 수행',
            targetProgress: 60,
            targetDate: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000), // 1.5개월 후
            priority: 2,
          },
          {
            title: '포트폴리오 구축',
            description: '성과물을 보여줄 수 있는 포트폴리오 완성',
            targetProgress: 90,
            targetDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000), // 3개월 후
            priority: 3,
          },
        ];

      case GoalCategory.EDUCATION:
        return [
          {
            title: '학습 계획 수립',
            description: '체계적인 학습 계획 세우기',
            targetProgress: 20,
            targetDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1주일 후
            priority: 1,
          },
          {
            title: '중간 점검 및 복습',
            description: '학습 내용 점검 및 보완',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1개월 후
            priority: 2,
          },
          {
            title: '최종 평가 및 정리',
            description: '학습 성과 평가 및 정리',
            targetProgress: 80,
            targetDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 2개월 후
            priority: 3,
          },
        ];

      default:
        return [
          {
            title: '첫 번째 단계 완료',
            description: '목표 달성을 위한 첫 걸음',
            targetProgress: 25,
            targetDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2주일 후
            priority: 1,
          },
          {
            title: '중간 점검',
            description: '진행 상황 점검 및 조정',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000), // 1개월 후
            priority: 2,
          },
          {
            title: '최종 단계',
            description: '목표 달성을 위한 마지막 단계',
            targetProgress: 75,
            targetDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000), // 2개월 후
            priority: 3,
          },
        ];
    }
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

      // 목표는 이미 extractGoals에서 처리되었으므로 여기서는 저장하지 않음
      console.log(`[Agent] Saved ${state.detectedEmotions.length} emotions`);
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

  // 목표 진행률 업데이트
  async updateGoalProgress(goalId: number, progress: number): Promise<any> {
    try {
      const goal = await this.goalRepository.findOne({
        where: { id: goalId },
        relations: ['milestones'],
      });
      if (!goal) {
        throw new Error('목표를 찾을 수 없습니다.');
      }

      // 진행률 범위 검증 (0-100)
      const validatedProgress = Math.max(0, Math.min(100, progress));
      const previousProgress = goal.progress;

      goal.progress = validatedProgress;
      goal.lastCheckedAt = new Date();

      // 마일스톤 달성 체크
      const achievedMilestones = await this.checkMilestoneAchievement(
        goal,
        validatedProgress,
        previousProgress,
      );

      // 목표 완료 체크
      if (validatedProgress >= 100 && goal.status !== GoalStatus.COMPLETED) {
        goal.status = GoalStatus.COMPLETED;
        goal.completedAt = new Date();
      }

      const updatedGoal = await this.goalRepository.save(goal);

      console.log(
        `[Agent] Goal progress updated: "${goal.title}" - ${validatedProgress}%`,
      );

      return {
        success: true,
        goal: updatedGoal,
        achievedMilestones,
        message:
          validatedProgress >= 100
            ? '목표를 달성하셨습니다! 🎉'
            : '진행률이 업데이트되었습니다.',
      };
    } catch (error) {
      console.error('[Agent] Error updating goal progress:', error);
      throw error;
    }
  }

  // 마일스톤 달성 체크
  private async checkMilestoneAchievement(
    goal: Goal,
    currentProgress: number,
    previousProgress: number,
  ): Promise<any[]> {
    const achievedMilestones = [];

    // 마일스톤을 별도로 조회
    const milestones = await this.milestoneRepository.find({
      where: { goalId: goal.id },
    });

    for (const milestone of milestones) {
      if (
        milestone.status === MilestoneStatus.PENDING &&
        currentProgress >= milestone.targetProgress &&
        previousProgress < milestone.targetProgress
      ) {
        milestone.status = MilestoneStatus.ACHIEVED;
        milestone.achievedAt = new Date();
        await this.milestoneRepository.save(milestone);

        achievedMilestones.push({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description,
          targetProgress: milestone.targetProgress,
        });

        console.log(
          `[Agent] Milestone achieved: "${milestone.title}" for goal "${goal.title}"`,
        );
      }
    }

    return achievedMilestones;
  }

  // 사용자의 모든 목표 조회
  async getUserGoals(userId: string): Promise<any> {
    try {
      const goals = await this.goalRepository.find({
        where: { userId },
        order: {
          status: 'ASC', // ACTIVE 먼저, 그 다음 COMPLETED
          priority: 'DESC',
          createdAt: 'DESC',
        },
      });

      // 목표별 통계
      const statistics = {
        total: goals.length,
        active: goals.filter((g) => g.status === GoalStatus.ACTIVE).length,
        completed: goals.filter((g) => g.status === GoalStatus.COMPLETED)
          .length,
        byCategory: {} as Record<string, number>,
        byPriority: {} as Record<string, number>,
      };

      // 카테고리별 통계
      goals.forEach((goal) => {
        statistics.byCategory[goal.category] =
          (statistics.byCategory[goal.category] || 0) + 1;
        statistics.byPriority[goal.priority.toString()] =
          (statistics.byPriority[goal.priority.toString()] || 0) + 1;
      });

      // 개인화된 목표 추천
      const recommendations = await this.generatePersonalizedRecommendations(
        userId,
        goals,
      );

      return {
        goals,
        statistics,
        recommendations,
      };
    } catch (error) {
      console.error('[Agent] Error getting user goals:', error);
      throw error;
    }
  }

  // 개인화된 목표 추천 생성
  private async generatePersonalizedRecommendations(
    userId: string,
    existingGoals: Goal[],
  ): Promise<any[]> {
    const recommendations = [];

    // 1. 사용자 패턴 분석
    const userPatterns = await this.analyzeUserPatterns(userId, existingGoals);

    // 2. 계절/시기별 목표 추천
    const seasonalGoals = this.getSeasonalGoals();

    // 3. 개인화된 목표 생성
    const personalizedGoals = this.generatePersonalizedGoals(userPatterns);

    // 4. 추천 목표 조합 및 우선순위 설정
    const allRecommendations = [...seasonalGoals, ...personalizedGoals];

    // 5. 사용자가 이미 가지고 있는 목표 제외
    const existingGoalTitles = existingGoals.map((goal) =>
      goal.title.toLowerCase().trim(),
    );

    const filteredRecommendations = allRecommendations.filter((rec) => {
      const recTitle = rec.title.toLowerCase().trim();
      // 제목이 정확히 일치하거나 포함 관계인 경우 제외
      return !existingGoalTitles.some(
        (existingTitle) =>
          existingTitle === recTitle ||
          existingTitle.includes(recTitle) ||
          recTitle.includes(existingTitle),
      );
    });

    // 6. 중복 제거 및 우선순위 정렬
    const uniqueRecommendations = filteredRecommendations.filter(
      (rec, index, self) =>
        index === self.findIndex((r) => r.title === rec.title),
    );

    return uniqueRecommendations.slice(0, 5); // 상위 5개만 반환
  }

  // 사용자 패턴 분석
  private async analyzeUserPatterns(
    userId: string,
    existingGoals: Goal[],
  ): Promise<any> {
    const patterns = {
      preferredCategories: [] as string[],
      averageProgress: 0,
      completionRate: 0,
      activeGoalsCount: 0,
      recentActivity: false,
    };

    if (existingGoals.length === 0) {
      return patterns;
    }

    // 선호 카테고리 분석
    const categoryCounts: Record<string, number> = {};
    existingGoals.forEach((goal) => {
      categoryCounts[goal.category] = (categoryCounts[goal.category] || 0) + 1;
    });

    patterns.preferredCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // 평균 진행률
    const activeGoals = existingGoals.filter(
      (g) => g.status === GoalStatus.ACTIVE,
    );
    patterns.averageProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, goal) => sum + goal.progress, 0) /
          activeGoals.length
        : 0;

    // 완료율
    patterns.completionRate =
      existingGoals.length > 0
        ? (existingGoals.filter((g) => g.status === GoalStatus.COMPLETED)
            .length /
            existingGoals.length) *
          100
        : 0;

    // 활성 목표 수
    patterns.activeGoalsCount = activeGoals.length;

    // 최근 활동 여부 (최근 7일)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    patterns.recentActivity = existingGoals.some(
      (g) => g.lastCheckedAt && g.lastCheckedAt > weekAgo,
    );

    return patterns;
  }

  // 계절/시기별 목표 추천
  private getSeasonalGoals(): any[] {
    const currentMonth = new Date().getMonth();
    const seasonalGoals = [];

    // 봄 (3-5월)
    if (currentMonth >= 2 && currentMonth <= 4) {
      seasonalGoals.push(
        {
          title: '봄맞이 다이어트',
          description: '따뜻한 봄날씨와 함께 건강한 다이어트를 시작해보세요',
          category: GoalCategory.HEALTH,
          priority: 7,
          reason: '봄철 다이어트',
        },
        {
          title: '새로운 취미 시작',
          description: '봄의 새로운 시작과 함께 새로운 취미를 찾아보세요',
          category: GoalCategory.HOBBY,
          priority: 6,
          reason: '봄철 새로운 시작',
        },
      );
    }
    // 여름 (6-8월)
    else if (currentMonth >= 5 && currentMonth <= 7) {
      seasonalGoals.push(
        {
          title: '여름 휴가 계획',
          description: '여름 휴가를 위한 여행 계획을 세워보세요',
          category: GoalCategory.TRAVEL,
          priority: 7,
          reason: '여름 휴가 시즌',
        },
        {
          title: '여름 운동 루틴',
          description:
            '더운 여름에도 건강을 유지할 수 있는 운동 루틴을 만들어보세요',
          category: GoalCategory.HEALTH,
          priority: 6,
          reason: '여름 건강 관리',
        },
      );
    }
    // 가을 (9-11월)
    else if (currentMonth >= 8 && currentMonth <= 10) {
      seasonalGoals.push(
        {
          title: '가을 독서 계획',
          description: '선선한 가을날 책과 함께하는 시간을 가져보세요',
          category: GoalCategory.EDUCATION,
          priority: 6,
          reason: '가을 독서 시즌',
        },
        {
          title: '연말 정리 및 계획',
          description: '한 해를 마무리하고 새로운 해를 준비해보세요',
          category: GoalCategory.PERSONAL,
          priority: 7,
          reason: '연말 정리 시즌',
        },
      );
    }
    // 겨울 (12-2월)
    else {
      seasonalGoals.push(
        {
          title: '새해 목표 설정',
          description: '새로운 한 해를 위한 목표를 설정해보세요',
          category: GoalCategory.PERSONAL,
          priority: 8,
          reason: '새해 목표 설정',
        },
        {
          title: '겨울 실내 운동',
          description: '추운 겨울에도 실내에서 할 수 있는 운동을 찾아보세요',
          category: GoalCategory.HEALTH,
          priority: 6,
          reason: '겨울 건강 관리',
        },
      );
    }

    return seasonalGoals;
  }

  // 개인화된 목표 생성
  private generatePersonalizedGoals(userPatterns: any): any[] {
    const personalizedGoals = [];

    // 완료율이 낮은 경우 - 쉬운 목표 추천
    if (userPatterns.completionRate < 30) {
      personalizedGoals.push({
        title: '작은 습관 만들기',
        description: '매일 5분씩 할 수 있는 작은 습관부터 시작해보세요',
        category: GoalCategory.PERSONAL,
        priority: 5,
        reason: '낮은 완료율 개선',
      });
    }

    // 활성 목표가 많은 경우 - 완료에 집중
    if (userPatterns.activeGoalsCount > 3) {
      personalizedGoals.push({
        title: '목표 정리 및 우선순위 설정',
        description:
          '현재 진행 중인 목표들을 정리하고 우선순위를 다시 설정해보세요',
        category: GoalCategory.PERSONAL,
        priority: 8,
        reason: '다중 목표 관리',
      });
    }

    // 선호 카테고리가 있는 경우 - 관련 목표 추천
    if (userPatterns.preferredCategories.length > 0) {
      const preferredCategory = userPatterns.preferredCategories[0];
      const categoryGoals = this.getCategorySpecificGoals(preferredCategory);
      personalizedGoals.push(...categoryGoals);
    }

    // 최근 활동이 없는 경우 - 동기부여 목표
    if (!userPatterns.recentActivity) {
      personalizedGoals.push({
        title: '새로운 도전 시작',
        description: '오랫동안 미뤄둔 새로운 도전을 시작해보세요',
        category: GoalCategory.PERSONAL,
        priority: 7,
        reason: '활동 재개',
      });
    }

    return personalizedGoals;
  }

  // 카테고리별 특화 목표
  private getCategorySpecificGoals(category: string): any[] {
    switch (category) {
      case GoalCategory.HEALTH:
        return [
          {
            title: '건강한 식습관 만들기',
            description:
              '균형 잡힌 식단과 규칙적인 식사를 위한 목표를 설정해보세요',
            category: GoalCategory.HEALTH,
            priority: 7,
            reason: '건강 카테고리 선호',
          },
        ];
      case GoalCategory.CAREER:
        return [
          {
            title: '자기계발 및 스킬 향상',
            description:
              '직장에서 더 나은 성과를 위한 새로운 스킬을 배워보세요',
            category: GoalCategory.CAREER,
            priority: 7,
            reason: '커리어 카테고리 선호',
          },
        ];
      case GoalCategory.EDUCATION:
        return [
          {
            title: '새로운 언어 학습',
            description: '새로운 언어를 배워서 지식을 넓혀보세요',
            category: GoalCategory.EDUCATION,
            priority: 6,
            reason: '교육 카테고리 선호',
          },
        ];
      default:
        return [];
    }
  }

  // 목표 삭제
  async deleteGoal(goalId: number): Promise<any> {
    try {
      const goal = await this.goalRepository.findOne({ where: { id: goalId } });
      if (!goal) {
        throw new Error('목표를 찾을 수 없습니다.');
      }

      // 목표와 관련된 마일스톤도 함께 삭제 (CASCADE 설정으로 자동 삭제됨)
      await this.goalRepository.remove(goal);

      console.log(`[Agent] Goal deleted: "${goal.title}" (ID: ${goalId})`);

      return {
        success: true,
        message: `"${goal.title}" 목표가 삭제되었습니다.`,
      };
    } catch (error) {
      console.error('[Agent] Error deleting goal:', error);
      throw error;
    }
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

  /**
   * 새로운 목표를 생성합니다.
   * @param userId - 사용자 ID
   * @param goalData - 목표 데이터
   * @returns 생성된 목표
   */
  async createGoal(
    userId: string,
    goalData: {
      title: string;
      description?: string;
      category: string;
      priority: number;
    },
  ): Promise<Goal> {
    try {
      // 중복 목표 확인
      const existingGoal = await this.goalRepository.findOne({
        where: {
          userId,
          title: goalData.title,
          status: GoalStatus.ACTIVE,
        },
      });

      if (existingGoal) {
        throw new Error('이미 존재하는 활성 목표입니다.');
      }

      // 목표 생성
      const goal = this.goalRepository.create({
        userId,
        title: goalData.title,
        description: goalData.description || '',
        category: goalData.category as GoalCategory,
        priority: goalData.priority,
        status: GoalStatus.ACTIVE,
        progress: 0,
        createdAt: new Date(),
        lastCheckedAt: new Date(),
      });

      const savedGoal = await this.goalRepository.save(goal);

      // 마일스톤 생성
      await this.generateMilestones(
        savedGoal.id,
        goalData.category as GoalCategory,
      );

      console.log(
        `✅ 목표 생성 완료: ${savedGoal.title} (ID: ${savedGoal.id})`,
      );
      return savedGoal;
    } catch (error) {
      console.error('목표 생성 실패:', error);
      throw error;
    }
  }
}
