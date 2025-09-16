import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ConversationAnalyticsService } from './conversation-analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  AnalyticsResult,
  RelationshipMilestone,
} from './types/analytics.types';
import { AuthenticatedRequest } from '../common/types/request.types';

@Controller('conversation-analytics')
@UseGuards(JwtAuthGuard)
export class ConversationAnalyticsController {
  constructor(
    private readonly analyticsService: ConversationAnalyticsService,
  ) {}

  @Get()
  async getAnalytics(
    @Request() req: AuthenticatedRequest,
    @Query('period') period: 'week' | 'month' | 'all' = 'month',
  ): Promise<AnalyticsResult> {
    return this.analyticsService.analyzeUserConversations(req.user.userId);
  }

  @Get('milestones')
  async getMilestones(
    @Request() req: AuthenticatedRequest,
  ): Promise<RelationshipMilestone[]> {
    const analytics = await this.analyticsService.analyzeUserConversations(
      req.user.userId,
    );
    return analytics.milestones;
  }
}
