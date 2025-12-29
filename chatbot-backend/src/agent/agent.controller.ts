import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/request.types';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(private readonly agentService: AgentService) {
    this.logger.debug('[AgentController] Constructor 실행 - 에이전트 컨트롤러 초기화');
  }

  /**
   * 사용자 맞춤 추천 질문을 가져옵니다
   * 감정, 목표, 시간대, 계절을 기반으로 동적으로 생성됩니다
   */
  @Get('suggestions')
  async getSuggestedQuestions(@Request() req: AuthenticatedRequest) {
    this.logger.debug(
      `[getSuggestedQuestions] 호출 - userId: ${req.user.userId}`,
    );
    try {
      const result = await this.agentService.getSuggestedQuestions(
        req.user.userId,
      );
      this.logger.debug(
        `[getSuggestedQuestions] 완료 - userId: ${req.user.userId}, 질문 개수: ${result.suggestions?.length || 0}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `[getSuggestedQuestions] 실패 - userId: ${req.user.userId}`,
        error,
      );
      throw new HttpException(
        '추천 질문을 가져오는데 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  async getAgentStatus(@Request() req: AuthenticatedRequest) {
    this.logger.debug(`[getAgentStatus] 호출 - userId: ${req.user.userId}`);
    try {
      const agentStatus = await this.agentService.getAgentStatus(
        req.user.userId,
      );
      const cacheStats = this.agentService.getCacheStats();

      this.logger.debug(`[getAgentStatus] 완료 - userId: ${req.user.userId}`);
      return {
        ...agentStatus,
        memoryCache: {
          ...cacheStats,
          memoryUsageKB: Math.round(cacheStats.memoryUsage / 1024),
        },
      };
    } catch (error) {
      this.logger.error(
        `[getAgentStatus] 실패 - userId: ${req.user.userId}`,
        error,
      );
      throw new HttpException(
        '에이전트 상태를 가져오는데 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('goals/:goalId/progress')
  async updateGoalProgress(
    @Param('goalId') goalId: number,
    @Body() body: { progress: number },
  ) {
    this.logger.debug(
      `[updateGoalProgress] 호출 - goalId: ${goalId}, progress: ${body.progress}`,
    );
    const result = await this.agentService.updateGoalProgress(
      goalId,
      body.progress,
    );
    this.logger.debug(`[updateGoalProgress] 완료 - goalId: ${goalId}`);
    return result;
  }

  @Get('goals')
  async getUserGoals(@Request() req: AuthenticatedRequest) {
    this.logger.debug(`[getUserGoals] 호출 - userId: ${req.user.userId}`);
    const result = await this.agentService.getUserGoals(req.user.userId);
    this.logger.debug(
      `[getUserGoals] 완료 - userId: ${req.user.userId}, 목표 개수: ${result.goals?.length || 0}`,
    );
    return result;
  }

  @Delete('goals/:goalId')
  async deleteGoal(@Param('goalId') goalId: number) {
    this.logger.debug(`[deleteGoal] 호출 - goalId: ${goalId}`);
    const result = await this.agentService.deleteGoal(goalId);
    this.logger.debug(`[deleteGoal] 완료 - goalId: ${goalId}`);
    return result;
  }

  @Post('goals')
  async createGoal(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: {
      title: string;
      description?: string;
      category: string;
      priority: number;
    },
  ) {
    return this.agentService.createGoal(req.user.userId, body);
  }

  /**
   * 메모리 캐시 상태를 조회합니다 (관리자용)
   */
  @Get('cache/stats')
  async getCacheStats() {
    try {
      const stats = this.agentService.getCacheStats();
      const processMemory = process.memoryUsage();

      return {
        cache: {
          ...stats,
          memoryUsageKB: Math.round(stats.memoryUsage / 1024),
          utilizationPercent: Math.round((stats.size / stats.maxSize) * 100),
        },
        process: {
          rssKB: Math.round(processMemory.rss / 1024),
          heapUsedKB: Math.round(processMemory.heapUsed / 1024),
          heapTotalKB: Math.round(processMemory.heapTotal / 1024),
          externalKB: Math.round(processMemory.external / 1024),
        },
      };
    } catch (error) {
      throw new HttpException(
        '캐시 상태를 가져오는데 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 사용자의 메모리 캐시를 무효화합니다
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Delete('cache/invalidate')
  async invalidateUserCache(@Request() req: AuthenticatedRequest) {
    try {
      this.agentService.invalidateUserCache(req.user.userId);
      return {
        message: '사용자 캐시가 무효화되었습니다.',
        userId: req.user.userId,
      };
    } catch (error) {
      throw new HttpException(
        '캐시 무효화에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
