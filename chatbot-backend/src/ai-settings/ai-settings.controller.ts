import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';
import { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai-settings')
@UseGuards(JwtAuthGuard)
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  @Get()
  async getSettings(@Request() req) {
    return this.aiSettingsService.findByUserId(req.user.userId);
  }

  @Put()
  async updateSettings(@Request() req, @Body() updateDto: UpdateAiSettingsDto) {
    return this.aiSettingsService.update(req.user.userId, updateDto);
  }
}
