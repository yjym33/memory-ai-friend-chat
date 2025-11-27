import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Milestone, MilestoneStatus } from '../entities/milestone.entity';
import { GoalCategory } from '../entities/goal.entity';

/**
 * 마일스톤 템플릿 인터페이스
 */
export interface MilestoneTemplate {
  title: string;
  description: string;
  targetProgress: number;
  targetDate: Date;
  priority: number;
}

/**
 * 진행 상황 패턴 인터페이스
 */
export interface ProgressPattern {
  pattern: RegExp;
  amount: number;
  reason: string;
}

/**
 * Milestone Service
 * 목표의 마일스톤을 관리하고 진행 상황을 추적합니다.
 */
@Injectable()
export class MilestoneService {
  private readonly logger = new Logger(MilestoneService.name);

  constructor(
    @InjectRepository(Milestone)
    private milestoneRepository: Repository<Milestone>,
  ) {}

  /**
   * 목표에 대한 마일스톤을 자동 생성합니다
   * @param goalId - 목표 ID
   * @param category - 목표 카테고리
   * @returns 생성된 마일스톤 목록
   */
  async generateMilestones(
    goalId: number,
    category: GoalCategory,
  ): Promise<Milestone[]> {
    const templates = this.getMilestoneTemplates(category);
    const milestones: Milestone[] = [];

    for (const template of templates) {
      const milestone = await this.milestoneRepository.save({
        goalId,
        title: template.title,
        description: template.description,
        targetProgress: template.targetProgress,
        targetDate: template.targetDate,
        priority: template.priority,
        status: MilestoneStatus.PENDING,
      });
      milestones.push(milestone);
    }

    this.logger.log(
      `목표 ID ${goalId}에 대해 ${milestones.length}개 마일스톤 생성 완료`,
    );
    return milestones;
  }

  /**
   * 카테고리별 마일스톤 템플릿을 반환합니다
   * @param category - 목표 카테고리
   * @returns 마일스톤 템플릿 목록
   */
  getMilestoneTemplates(category: GoalCategory): MilestoneTemplate[] {
    const baseDate = new Date();

    switch (category) {
      case GoalCategory.HEALTH:
        return [
          {
            title: '첫 번째 운동 시작',
            description: '운동 습관을 만들기 위한 첫 걸음',
            targetProgress: 25,
            targetDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            priority: 1,
          },
          {
            title: '1개월 운동 지속',
            description: '꾸준한 운동 습관 형성',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            priority: 2,
          },
          {
            title: '3개월 운동 완료',
            description: '장기적인 건강 목표 달성',
            targetProgress: 75,
            targetDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000),
            priority: 3,
          },
        ];

      case GoalCategory.CAREER:
        return [
          {
            title: '기초 학습 완료',
            description: '기본 개념과 이론 학습',
            targetProgress: 30,
            targetDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
            priority: 1,
          },
          {
            title: '실습 프로젝트 완료',
            description: '실제 적용 가능한 프로젝트 수행',
            targetProgress: 60,
            targetDate: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000),
            priority: 2,
          },
          {
            title: '포트폴리오 구축',
            description: '성과물을 보여줄 수 있는 포트폴리오 완성',
            targetProgress: 90,
            targetDate: new Date(baseDate.getTime() + 90 * 24 * 60 * 60 * 1000),
            priority: 3,
          },
        ];

      case GoalCategory.EDUCATION:
        return [
          {
            title: '학습 계획 수립',
            description: '체계적인 학습 계획 세우기',
            targetProgress: 20,
            targetDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000),
            priority: 1,
          },
          {
            title: '중간 점검 및 복습',
            description: '학습 내용 점검 및 보완',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            priority: 2,
          },
          {
            title: '최종 평가 및 정리',
            description: '학습 성과 평가 및 정리',
            targetProgress: 80,
            targetDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000),
            priority: 3,
          },
        ];

      default:
        return [
          {
            title: '첫 번째 단계 완료',
            description: '목표 달성을 위한 첫 걸음',
            targetProgress: 25,
            targetDate: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000),
            priority: 1,
          },
          {
            title: '중간 점검',
            description: '진행 상황 점검 및 조정',
            targetProgress: 50,
            targetDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000),
            priority: 2,
          },
          {
            title: '최종 단계',
            description: '목표 달성을 위한 마지막 단계',
            targetProgress: 75,
            targetDate: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000),
            priority: 3,
          },
        ];
    }
  }

  /**
   * 마일스톤 달성 여부를 체크하고 업데이트합니다
   * @param goalId - 목표 ID
   * @param currentProgress - 현재 진행률
   * @param previousProgress - 이전 진행률
   * @returns 달성된 마일스톤 목록
   */
  async checkMilestoneAchievement(
    goalId: number,
    currentProgress: number,
    previousProgress: number,
  ): Promise<Milestone[]> {
    const achievedMilestones: Milestone[] = [];

    const milestones = await this.milestoneRepository.find({
      where: { goalId },
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

        achievedMilestones.push(milestone);
        this.logger.log(`마일스톤 달성: "${milestone.title}"`);
      }
    }

    return achievedMilestones;
  }

  /**
   * 목표의 마일스톤 목록을 조회합니다
   * @param goalId - 목표 ID
   * @returns 마일스톤 목록
   */
  async getMilestonesByGoalId(goalId: number): Promise<Milestone[]> {
    return this.milestoneRepository.find({
      where: { goalId },
      order: { priority: 'ASC' },
    });
  }

  /**
   * 마일스톤 상태를 업데이트합니다
   * @param milestoneId - 마일스톤 ID
   * @param status - 새 상태
   * @returns 업데이트된 마일스톤
   */
  async updateMilestoneStatus(
    milestoneId: number,
    status: MilestoneStatus,
  ): Promise<Milestone | null> {
    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return null;
    }

    milestone.status = status;
    if (status === MilestoneStatus.ACHIEVED) {
      milestone.achievedAt = new Date();
    }

    return this.milestoneRepository.save(milestone);
  }

  /**
   * 마일스톤을 삭제합니다
   * @param milestoneId - 마일스톤 ID
   */
  async deleteMilestone(milestoneId: number): Promise<void> {
    await this.milestoneRepository.delete(milestoneId);
  }

  /**
   * 목표에 속한 모든 마일스톤을 삭제합니다
   * @param goalId - 목표 ID
   */
  async deleteMilestonesByGoalId(goalId: number): Promise<void> {
    await this.milestoneRepository.delete({ goalId });
    this.logger.log(`목표 ID ${goalId}의 모든 마일스톤 삭제 완료`);
  }

  /**
   * 카테고리별 진행 상황 패턴을 반환합니다
   * @param category - 목표 카테고리
   * @returns 진행 상황 패턴 목록
   */
  getCategoryProgressPatterns(category: GoalCategory): ProgressPattern[] {
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

  /**
   * 기본 진행 상황 패턴을 반환합니다
   * @returns 기본 진행 상황 패턴 목록
   */
  getDefaultProgressPatterns(): ProgressPattern[] {
    return [
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
  }
}

