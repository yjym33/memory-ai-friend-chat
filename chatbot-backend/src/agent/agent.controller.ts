import { Controller, Get, Request, UseGuards } from '@nestjs/common';
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
}
