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
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/request.types';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('status')
  async getAgentStatus(@Request() req: AuthenticatedRequest) {
    try {
      const agentStatus = await this.agentService.getAgentStatus(
        req.user.userId,
      );
      const cacheStats = this.agentService.getCacheStats();

      return {
        ...agentStatus,
        memoryCache: {
          ...cacheStats,
          memoryUsageKB: Math.round(cacheStats.memoryUsage / 1024),
        },
      };
    } catch (error) {
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
    return this.agentService.updateGoalProgress(goalId, body.progress);
  }

  @Get('goals')
  async getUserGoals(@Request() req: AuthenticatedRequest) {
    return this.agentService.getUserGoals(req.user.userId);
  }

  @Delete('goals/:goalId')
  async deleteGoal(@Param('goalId') goalId: number) {
    return this.agentService.deleteGoal(goalId);
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
