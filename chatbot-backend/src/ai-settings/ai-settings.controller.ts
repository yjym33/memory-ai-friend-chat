import { Controller, Get, Put, Body, Request, UseGuards } from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';
import { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * AI 설정 관련 API를 처리하는 컨트롤러
 * 사용자별 AI 설정의 조회와 업데이트를 담당합니다.
 */
@Controller('ai-settings')
@UseGuards(JwtAuthGuard) // JWT 인증이 필요한 모든 엔드포인트
export class AiSettingsController {
  constructor(private readonly aiSettingsService: AiSettingsService) {}

  /**
   * 현재 사용자의 AI 설정을 조회합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   * @returns AI 설정 객체
   */
  @Get()
  async getSettings(@Request() req) {
    return this.aiSettingsService.findByUserId(req.user.userId);
  }

  /**
   * 현재 사용자의 AI 설정을 업데이트합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   * @param updateDto - 업데이트할 설정 데이터
   * @returns 업데이트된 AI 설정 객체
   */
  @Put()
  async updateSettings(@Request() req, @Body() updateDto: UpdateAiSettingsDto) {
    return this.aiSettingsService.update(req.user.userId, updateDto);
  }
}
