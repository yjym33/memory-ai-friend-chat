import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

// Entities
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';
import { Goal } from './entities/goal.entity';

// Types
import {
  AgentState,
  AgentStatusSummary,
  EmotionSummaryItem,
  GoalProgressSummary,
} from './types/agent-state';
import { Emotion, EmotionType } from './entities/emotion.entity';
import { GoalCategory } from './entities/goal.entity';

// Services
import { EmotionAnalyzerService } from './services/emotion-analyzer.service';
import { GoalManagerService } from './services/goal-manager.service';
import { MemoryService } from './services/memory.service';
import { PromptGeneratorService } from './services/prompt-generator.service';
import { AgentCacheService } from './services/agent-cache.service';

/**
 * Agent Service - Orchestrator
 * 각 하위 서비스를 조율하여 에이전트 워크플로우를 실행합니다.
 *
 * 분리된 서비스들:
 * - EmotionAnalyzerService: 감정 분석
 * - GoalManagerService: 목표 관리
 * - MemoryService: 대화 기억 관리
 * - PromptGeneratorService: 프롬프트 생성
 * - AgentCacheService: 캐시 관리
 */
@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectRepository(AiSettings)
    private aiSettingsRepository: Repository<AiSettings>,
    private readonly emotionAnalyzer: EmotionAnalyzerService,
    private readonly goalManager: GoalManagerService,
    private readonly memoryService: MemoryService,
    private readonly promptGenerator: PromptGeneratorService,
    private readonly cacheService: AgentCacheService,
  ) {}

  /**
   * 메시지를 처리하고 응답을 생성합니다
   * @param userId - 사용자 ID
   * @param message - 사용자 메시지
   * @returns AI 응답
   */
  async processMessage(userId: string, message: string): Promise<string> {
    this.logger.log(`[Agent] Processing message for user ${userId}`);

    // 1. 에이전트 상태 초기화
    const state = this.initializeState(userId, message);

    // 2. 컨텍스트 로드
    await this.loadContext(state);

    // 3. 분석 파이프라인 실행
    await this.runAnalysisPipeline(state);

    // 4. 팔로업 체크
    this.checkFollowUp(state);

    // 5. 응답 생성
    let response = '';
    if (state.shouldFollowUp) {
      response = this.generateSupportResponse(state);
    }

    // 6. 감정/목표가 없으면 LLM 일반 답변 호출
    if (!response) {
      response = await this.getLLMGeneralResponse(userId, message);
    }

    // 7. 데이터 저장
    await this.saveAgentData(state);

    return response;
  }

  /**
   * 에이전트 상태를 초기화합니다
   */
  private initializeState(userId: string, message: string): AgentState {
    return {
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
  }

  /**
   * 사용자 컨텍스트를 로드합니다
   */
  private async loadContext(state: AgentState): Promise<void> {
    this.logger.debug(`[Agent] Loading context for user ${state.userId}`);

    // 최근 감정 데이터 로드
    const recentEmotions = await this.emotionAnalyzer.getRecentEmotions(
      state.userId,
      10,
    );
    state.recentEmotions = this.emotionAnalyzer.formatRecentEmotions(recentEmotions);

    // 활성 목표 로드
    const activeGoals = await this.goalManager.getActiveGoals(state.userId);
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

  /**
   * 분석 파이프라인을 실행합니다
   */
  private async runAnalysisPipeline(state: AgentState): Promise<void> {
    // 감정 분석
    const emotionResult = this.emotionAnalyzer.analyzeEmotion(state.currentMessage);
    state.detectedEmotions = emotionResult.emotions;
    state.needsEmotionSupport = this.emotionAnalyzer.needsEmotionSupport(
      emotionResult.emotions,
    );

    state.actions.push({
      type: 'emotion_track',
      data: emotionResult,
      timestamp: new Date(),
    });

    // 목표 추출
    const goalResult = this.goalManager.extractGoals(state.currentMessage);
    state.extractedGoals = goalResult.goals;
    state.needsGoalCheck = goalResult.goals.length > 0;

    // 새로운 목표 저장
    if (goalResult.goals.length > 0) {
      await this.goalManager.saveExtractedGoals(state.userId, goalResult.goals);
    }

    // 진행 상황 자동 감지
    await this.goalManager.detectProgressFromMessage(
      state.userId,
      state.currentMessage,
    );

    state.actions.push({
      type: 'goal_extract',
      data: goalResult,
      timestamp: new Date(),
    });
  }

  /**
   * 팔로업 필요 여부를 체크합니다
   */
  private checkFollowUp(state: AgentState): void {
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

  /**
   * 지원 응답을 생성합니다
   */
  private generateSupportResponse(state: AgentState): string {
    let response = '';

    // 감정 지원 응답
    if (state.needsEmotionSupport && state.detectedEmotions.length > 0) {
      response = this.emotionAnalyzer.generateSupportMessage(
        state.detectedEmotions[0],
      );
    }

    // 목표 관련 응답
    if (state.needsGoalCheck && state.extractedGoals.length > 0) {
      const goalMessage = this.goalManager.generateGoalSupportMessage(
        state.extractedGoals[0],
      );
      response = response ? `${response}\n\n${goalMessage}` : goalMessage;
    }

    state.actions.push({
      type: 'support',
      data: { message: response },
      timestamp: new Date(),
    });

    return response;
  }

  /**
   * LLM을 사용하여 일반 응답을 생성합니다
   */
  private async getLLMGeneralResponse(
    userId: string,
    message: string,
  ): Promise<string> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return 'AI 시스템 오류: OpenAI API 키가 없습니다.';

      // AI 설정 불러오기
      const aiSettings = await this.getAiSettings(userId);

      // 대화 히스토리 불러오기
      const memories = await this.memoryService.getRecentMemories(
        userId,
        aiSettings.memoryRetentionDays,
      );

      // 우선순위 적용된 기억
      const prioritizedMemories = this.memoryService.prioritizeMemories(
        memories,
        aiSettings.memoryPriorities,
      );

      // 시스템 프롬프트 생성
      const systemPrompt = this.promptGenerator.generatePromptWithMemory(
        aiSettings,
        prioritizedMemories,
      );

      this.logger.debug(`🤖 AI 설정이 적용된 시스템 프롬프트 생성 완료`);

      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
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
      this.logger.error('[OpenAI] 일반 답변 생성 오류:', e);
      return '죄송해요, 답변을 생성하는 데 문제가 발생했어요.';
    }
  }

  /**
   * 에이전트 데이터를 저장합니다
   */
  private async saveAgentData(state: AgentState): Promise<void> {
    try {
      // 감정 데이터 저장
      await this.emotionAnalyzer.saveEmotions(
        state.userId,
        state.detectedEmotions,
        state.currentMessage,
      );

      this.logger.debug(`[Agent] Saved ${state.detectedEmotions.length} emotions`);
    } catch (error) {
      this.logger.error('[Agent] Error saving agent data:', error);
    }
  }

  /**
   * 사용자의 AI 설정을 가져옵니다
   */
  private async getAiSettings(userId: string): Promise<AiSettings> {
    let settings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      this.logger.log(
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

  // ============================================================
  // Public API - 외부에서 호출 가능한 메서드들
  // ============================================================

  /**
   * 에이전트 상태를 조회합니다
   */
  async getAgentStatus(userId: string): Promise<AgentStatusSummary> {
    // 최근 감정 데이터
    const recentEmotions = await this.emotionAnalyzer.getRecentEmotions(userId, 5);
    const formattedEmotions = this.emotionAnalyzer.formatRecentEmotions(recentEmotions);

    // 활성 목표
    const { goals: activeGoals, statistics } =
      await this.goalManager.getUserGoals(userId);

    // 감정 요약
    const emotionSummary = await this.emotionAnalyzer.getEmotionSummary(userId);

    // 목표 진행률 요약
    const goalProgress: GoalProgressSummary = {
      total: statistics.total,
      completed: statistics.completed,
      inProgress: statistics.active,
      notStarted: statistics.total - statistics.active - statistics.completed,
    };

    return {
      recentEmotions: formattedEmotions,
      activeGoals: activeGoals.map((g) => ({
        id: g.id,
        title: g.title,
        category: g.category,
        status: g.status,
        progress: g.progress,
        lastCheckedAt: g.lastCheckedAt,
      })),
      emotionSummary,
      goalProgress,
    };
  }

  /**
   * 목표 진행률을 업데이트합니다
   */
  async updateGoalProgress(
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
    return this.goalManager.updateProgress(goalId, progress);
  }

  /**
   * 사용자의 모든 목표를 조회합니다
   */
  async getUserGoals(userId: string): Promise<{
    goals: Goal[];
    statistics: {
      total: number;
      active: number;
      completed: number;
      byCategory: Record<string, number>;
      byPriority: Record<string, number>;
    };
    recommendations: Array<{
      title: string;
      description: string;
      category: GoalCategory;
      priority: number;
      reason: string;
    }>;
  }> {
    return this.goalManager.getUserGoals(userId);
  }

  /**
   * 새로운 목표를 생성합니다
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
    return this.goalManager.createGoal(userId, goalData);
  }

  /**
   * 목표를 삭제합니다
   */
  async deleteGoal(goalId: number): Promise<{ success: boolean; message: string }> {
    return this.goalManager.deleteGoal(goalId);
  }

  /**
   * 캐시 상태를 반환합니다 (모니터링용)
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    memoryUsage: number;
  } {
    return this.cacheService.getStats();
  }

  /**
   * 특정 사용자의 캐시를 무효화합니다
   */
  invalidateUserCache(userId: string): void {
    this.cacheService.invalidateUser(userId);
  }
}
