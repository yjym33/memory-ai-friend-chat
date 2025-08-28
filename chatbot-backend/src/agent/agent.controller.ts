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
} from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('agent')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('status')
  async getAgentStatus(@Request() req) {
    return this.agentService.getAgentStatus(req.user.userId);
  }

  @Put('goals/:goalId/progress')
  async updateGoalProgress(
    @Param('goalId') goalId: number,
    @Body() body: { progress: number },
  ) {
    return this.agentService.updateGoalProgress(goalId, body.progress);
  }

  @Get('goals')
  async getUserGoals(@Request() req) {
    return this.agentService.getUserGoals(req.user.userId);
  }

  @Delete('goals/:goalId')
  async deleteGoal(@Param('goalId') goalId: number) {
    return this.agentService.deleteGoal(goalId);
  }

  @Post('goals')
  async createGoal(
    @Request() req,
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
}
