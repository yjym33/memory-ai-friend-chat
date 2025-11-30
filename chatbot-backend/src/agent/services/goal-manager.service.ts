import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal, GoalStatus, GoalCategory } from '../entities/goal.entity';
import { Milestone } from '../entities/milestone.entity';
import { MilestoneService, ProgressPattern } from './milestone.service';
import { UserPatterns } from '../types/agent-state';

/**
 * 목표 추출 결과 인터페이스
 */
export interface GoalExtractionResult {
  goals: {
    title: string;
    category: GoalCategory;
    priority: number;
  }[];
  isUpdate: boolean;
}

/**
 * 목표 통계 인터페이스
 */
export interface GoalStatistics {
  total: number;
  active: number;
  completed: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
}

/**
 * 목표 추천 인터페이스
 */
export interface GoalRecommendation {
  title: string;
  description: string;
  category: GoalCategory;
  priority: number;
  reason: string;
}

/**
 * Goal Manager Service
 * 목표의 생성, 수정, 삭제 및 진행 상황을 관리합니다.
 */
@Injectable()
export class GoalManagerService {
  private readonly logger = new Logger(GoalManagerService.name);

  // 목표 추출 패턴
  private readonly goalPatterns: RegExp[] = [
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

  // 카테고리별 키워드
  private readonly goalKeywords: Record<GoalCategory, string[]> = {
    [GoalCategory.HEALTH]: [
      '다이어트', '운동', '건강', '체중', '헬스', '요가', '달리기', '수영', '금연', '금주',
    ],
    [GoalCategory.CAREER]: [
      '취업', '이직', '승진', '개발', '프로그래밍', '자격증', '면접', '회사', '직장',
    ],
    [GoalCategory.EDUCATION]: [
      '공부', '시험', '학습', '책', '강의', '교육', '대학', '학교', '과제', '연구',
      '독서', '읽기', '배우', '언어', '프로그래밍',
    ],
    [GoalCategory.RELATIONSHIP]: [
      '연애', '결혼', '친구', '가족', '관계', '데이트', '소개팅', '만남',
    ],
    [GoalCategory.FINANCE]: [
      '돈', '저축', '투자', '부업', '경제', '재정', '용돈', '월급', '수입', '여행', '자금', '모으',
    ],
    [GoalCategory.HOBBY]: [
      '취미', '여행', '음악', '그림', '사진', '요리', '독서', '게임',
    ],
    [GoalCategory.TRAVEL]: ['여행', '해외', '국내', '휴가', '방문'],
    [GoalCategory.PERSONAL]: ['나', '자기', '성장', '변화', '습관'],
    [GoalCategory.OTHER]: ['기타', '그외', '다른', '별도'],
  };

  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
    private milestoneService: MilestoneService,
  ) {}

  /**
   * 메시지에서 목표를 추출합니다
   * @param message - 분석할 메시지
   * @returns 목표 추출 결과
   */
  extractGoals(message: string): GoalExtractionResult {
    const goals: { title: string; category: GoalCategory; priority: number }[] = [];

    for (const pattern of this.goalPatterns) {
      // 패턴을 새로 생성하여 lastIndex 문제 방지
      const regex = new RegExp(pattern.source, pattern.flags);
      const matches = message.match(regex);

      if (matches) {
        for (const match of matches) {
          let category = GoalCategory.PERSONAL;
          let priority = 5;

          // 카테고리 추론
          for (const [cat, keywords] of Object.entries(this.goalKeywords)) {
            if (keywords.some((keyword) => match.includes(keyword))) {
              category = cat as GoalCategory;
              priority =
                category === GoalCategory.HEALTH || category === GoalCategory.CAREER
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

    this.logger.debug(`메시지에서 ${goals.length}개 목표 추출됨`);
    return { goals, isUpdate: false };
  }

  /**
   * 새 목표를 생성합니다
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

    // 마일스톤 자동 생성
    await this.milestoneService.generateMilestones(
      savedGoal.id,
      goalData.category as GoalCategory,
    );

    this.logger.log(`✅ 목표 생성 완료: ${savedGoal.title} (ID: ${savedGoal.id})`);
    return savedGoal;
  }

  /**
   * 추출된 목표들을 저장합니다 (중복 검사 포함)
   * @param userId - 사용자 ID
   * @param goals - 추출된 목표 목록
   */
  async saveExtractedGoals(
    userId: string,
    goals: { title: string; category: GoalCategory; priority: number }[],
  ): Promise<void> {
    for (const goal of goals) {
      try {
        const existingGoal = await this.goalRepository.findOne({
          where: {
            userId,
            title: goal.title,
            status: GoalStatus.ACTIVE,
          },
        });

        if (!existingGoal) {
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

          await this.milestoneService.generateMilestones(newGoal.id, goal.category);
          this.logger.log(`새 목표 저장: "${newGoal.title}" (ID: ${newGoal.id})`);
        }
      } catch (error) {
        this.logger.error(`목표 저장 실패: "${goal.title}"`, error);
      }
    }
  }

  /**
   * 목표 진행률을 업데이트합니다
   * @param goalId - 목표 ID
   * @param progress - 새 진행률
   * @returns 업데이트 결과
   */
  async updateProgress(
    goalId: number,
    progress: number,
  ): Promise<{
    success: boolean;
    goal: Goal;
    achievedMilestones: Array<{
      id: number;
      title: string;
      description: string;
      targetProgress: number;
    }>;
    message: string;
  }> {
    const goal = await this.goalRepository.findOne({
      where: { id: goalId },
    });

    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다.');
    }

    const validatedProgress = Math.max(0, Math.min(100, progress));
    const previousProgress = goal.progress;

    goal.progress = validatedProgress;
    goal.lastCheckedAt = new Date();

    // 마일스톤 달성 체크
    const achievedMilestones = await this.milestoneService.checkMilestoneAchievement(
      goal.id,
      validatedProgress,
      previousProgress,
    );

    // 목표 완료 체크
    if (validatedProgress >= 100 && goal.status !== GoalStatus.COMPLETED) {
      goal.status = GoalStatus.COMPLETED;
      goal.completedAt = new Date();
    }

    const updatedGoal = await this.goalRepository.save(goal);
    this.logger.log(`목표 진행률 업데이트: "${goal.title}" - ${validatedProgress}%`);

    return {
      success: true,
      goal: updatedGoal,
      achievedMilestones,
      message:
        validatedProgress >= 100
          ? '목표를 달성하셨습니다! 🎉'
          : '진행률이 업데이트되었습니다.',
    };
  }

  /**
   * 메시지에서 진행 상황을 자동 감지합니다
   * @param userId - 사용자 ID
   * @param message - 메시지
   */
  async detectProgressFromMessage(userId: string, message: string): Promise<void> {
    try {
      const activeGoals = await this.goalRepository.find({
        where: { userId, status: GoalStatus.ACTIVE },
      });

      for (const goal of activeGoals) {
        const progressUpdate = this.analyzeProgressMessage(message, goal);

        if (progressUpdate) {
          this.logger.log(
            `진행 상황 감지: "${goal.title}" - ${progressUpdate.amount}%`,
          );
          await this.updateProgress(goal.id, goal.progress + progressUpdate.amount);
        }
      }
    } catch (error) {
      this.logger.error('진행 상황 감지 실패:', error);
    }
  }

  /**
   * 메시지에서 진행 상황을 분석합니다
   * @param message - 메시지
   * @param goal - 목표
   * @returns 진행 상황 업데이트 정보
   */
  private analyzeProgressMessage(
    message: string,
    goal: Goal,
  ): { amount: number; reason: string } | null {
    const lowerMessage = message.toLowerCase();

    // 기본 패턴 + 카테고리 특화 패턴
    const defaultPatterns = this.milestoneService.getDefaultProgressPatterns();
    const categoryPatterns = this.milestoneService.getCategoryProgressPatterns(goal.category);
    const allPatterns: ProgressPattern[] = [...defaultPatterns, ...categoryPatterns];

    for (const pattern of allPatterns) {
      if (pattern.pattern.test(lowerMessage)) {
        return {
          amount: Math.min(pattern.amount, 100 - goal.progress),
          reason: pattern.reason,
        };
      }
    }

    return null;
  }

  /**
   * 사용자의 목표 목록을 조회합니다
   * @param userId - 사용자 ID
   * @returns 목표 목록과 통계
   */
  async getUserGoals(userId: string): Promise<{
    goals: Goal[];
    statistics: GoalStatistics;
    recommendations: GoalRecommendation[];
  }> {
    const goals = await this.goalRepository.find({
      where: { userId },
      order: {
        status: 'ASC',
        priority: 'DESC',
        createdAt: 'DESC',
      },
    });

    const statistics = this.calculateStatistics(goals);
    const recommendations = await this.generateRecommendations(userId, goals);

    return { goals, statistics, recommendations };
  }

  /**
   * 활성 목표 목록을 조회합니다
   * @param userId - 사용자 ID
   * @returns 활성 목표 목록
   */
  async getActiveGoals(userId: string): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { userId, status: GoalStatus.ACTIVE },
      order: { priority: 'DESC' },
    });
  }

  /**
   * 목표를 삭제합니다
   * @param goalId - 목표 ID
   */
  async deleteGoal(goalId: number): Promise<{ success: boolean; message: string }> {
    const goal = await this.goalRepository.findOne({ where: { id: goalId } });

    if (!goal) {
      throw new Error('목표를 찾을 수 없습니다.');
    }

    await this.goalRepository.remove(goal);
    this.logger.log(`목표 삭제: "${goal.title}" (ID: ${goalId})`);

    return {
      success: true,
      message: `"${goal.title}" 목표가 삭제되었습니다.`,
    };
  }

  /**
   * 목표 통계를 계산합니다
   * @param goals - 목표 목록
   * @returns 통계 정보
   */
  private calculateStatistics(goals: Goal[]): GoalStatistics {
    const statistics: GoalStatistics = {
      total: goals.length,
      active: goals.filter((g) => g.status === GoalStatus.ACTIVE).length,
      completed: goals.filter((g) => g.status === GoalStatus.COMPLETED).length,
      byCategory: {},
      byPriority: {},
    };

    goals.forEach((goal) => {
      statistics.byCategory[goal.category] =
        (statistics.byCategory[goal.category] || 0) + 1;
      statistics.byPriority[goal.priority.toString()] =
        (statistics.byPriority[goal.priority.toString()] || 0) + 1;
    });

    return statistics;
  }

  /**
   * 개인화된 목표 추천을 생성합니다
   * @param userId - 사용자 ID
   * @param existingGoals - 기존 목표 목록
   * @returns 추천 목표 목록
   */
  private async generateRecommendations(
    userId: string,
    existingGoals: Goal[],
  ): Promise<GoalRecommendation[]> {
    const userPatterns = this.analyzeUserPatterns(existingGoals);
    const seasonalGoals = this.getSeasonalGoals();
    const personalizedGoals = this.generatePersonalizedGoals(userPatterns);

    const allRecommendations = [...seasonalGoals, ...personalizedGoals];

    // 기존 목표와 중복 제거
    const existingTitles = existingGoals.map((g) => g.title.toLowerCase().trim());
    const filtered = allRecommendations.filter((rec) => {
      const recTitle = rec.title.toLowerCase().trim();
      return !existingTitles.some(
        (existing) =>
          existing === recTitle ||
          existing.includes(recTitle) ||
          recTitle.includes(existing),
      );
    });

    // 중복 제거 및 상위 5개 반환
    const unique = filtered.filter(
      (rec, idx, self) => idx === self.findIndex((r) => r.title === rec.title),
    );

    return unique.slice(0, 5);
  }

  /**
   * 사용자 패턴을 분석합니다
   */
  private analyzeUserPatterns(goals: Goal[]): UserPatterns {
    const patterns: UserPatterns = {
      preferredCategories: [],
      averageProgress: 0,
      completionRate: 0,
      activeGoalsCount: 0,
      recentActivity: false,
    };

    if (goals.length === 0) return patterns;

    const categoryCounts: Record<string, number> = {};
    goals.forEach((g) => {
      categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;
    });

    patterns.preferredCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    const activeGoals = goals.filter((g) => g.status === GoalStatus.ACTIVE);
    patterns.averageProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
        : 0;

    patterns.completionRate =
      goals.length > 0
        ? (goals.filter((g) => g.status === GoalStatus.COMPLETED).length /
            goals.length) *
          100
        : 0;

    patterns.activeGoalsCount = activeGoals.length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    patterns.recentActivity = goals.some(
      (g) => g.lastCheckedAt && g.lastCheckedAt > weekAgo,
    );

    return patterns;
  }

  /**
   * 계절/시기별 목표를 반환합니다
   */
  private getSeasonalGoals(): GoalRecommendation[] {
    const month = new Date().getMonth();

    if (month >= 2 && month <= 4) {
      // 봄
      return [
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
      ];
    } else if (month >= 5 && month <= 7) {
      // 여름
      return [
        {
          title: '여름 휴가 계획',
          description: '여름 휴가를 위한 여행 계획을 세워보세요',
          category: GoalCategory.TRAVEL,
          priority: 7,
          reason: '여름 휴가 시즌',
        },
        {
          title: '여름 운동 루틴',
          description: '더운 여름에도 건강을 유지할 수 있는 운동 루틴을 만들어보세요',
          category: GoalCategory.HEALTH,
          priority: 6,
          reason: '여름 건강 관리',
        },
      ];
    } else if (month >= 8 && month <= 10) {
      // 가을
      return [
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
      ];
    } else {
      // 겨울
      return [
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
      ];
    }
  }

  /**
   * 개인화된 목표를 생성합니다
   */
  private generatePersonalizedGoals(patterns: UserPatterns): GoalRecommendation[] {
    const goals: GoalRecommendation[] = [];

    if (patterns.completionRate < 30) {
      goals.push({
        title: '작은 습관 만들기',
        description: '매일 5분씩 할 수 있는 작은 습관부터 시작해보세요',
        category: GoalCategory.PERSONAL,
        priority: 5,
        reason: '낮은 완료율 개선',
      });
    }

    if (patterns.activeGoalsCount > 3) {
      goals.push({
        title: '목표 정리 및 우선순위 설정',
        description: '현재 진행 중인 목표들을 정리하고 우선순위를 다시 설정해보세요',
        category: GoalCategory.PERSONAL,
        priority: 8,
        reason: '다중 목표 관리',
      });
    }

    if (!patterns.recentActivity) {
      goals.push({
        title: '새로운 도전 시작',
        description: '오랫동안 미뤄둔 새로운 도전을 시작해보세요',
        category: GoalCategory.PERSONAL,
        priority: 7,
        reason: '활동 재개',
      });
    }

    return goals;
  }

  /**
   * 목표에 대한 응답 메시지를 생성합니다
   * @param goal - 목표 정보
   * @returns 응답 메시지
   */
  generateGoalSupportMessage(goal: {
    title: string;
    category: GoalCategory;
  }): string {
    let message = `🎯 "${goal.title}" 목표를 새로 설정하신 것 같네요! `;

    switch (goal.category) {
      case GoalCategory.HEALTH:
        message += '건강 목표는 정말 중요해요. 작은 변화부터 시작해보시는 건 어떨까요?';
        break;
      case GoalCategory.CAREER:
        message += '커리어 목표네요! 구체적인 계획을 세우면 더 도움이 될 것 같아요.';
        break;
      case GoalCategory.EDUCATION:
        message += '학습 목표군요! 꾸준히 하는 것이 가장 중요해요. 화이팅!';
        break;
      default:
        message += '이 목표를 위해 어떤 계획을 세우고 계신가요?';
    }

    return message;
  }
}

