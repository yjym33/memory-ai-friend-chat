import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AiSettingsService } from './ai-settings.service';
import { UpdateAiSettingsDto } from './dto/ai-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/request.types';
import { AiSettings, ChatMode } from './entity/ai-settings.entity';

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
  async getSettings(@Request() req: AuthenticatedRequest) {
    return this.aiSettingsService.findByUserId(req.user.userId);
  }

  /**
   * 현재 사용자의 AI 설정을 업데이트합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   * @param updateDto - 업데이트할 설정 데이터
   * @returns 업데이트된 AI 설정 객체
   */
  @Put()
  async updateSettings(
    @Request() req: AuthenticatedRequest,
    @Body() updateDto: UpdateAiSettingsDto,
  ) {
    return this.aiSettingsService.update(req.user.userId, updateDto);
  }

  /**
   * AI 설정을 테스트합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   * @param body - 테스트할 설정과 메시지
   * @returns AI 응답
   */
  @Post('test')
  async testSettings(
    @Request() req: AuthenticatedRequest,
    @Body() body: { settings: UpdateAiSettingsDto; message: string },
  ) {
    return this.aiSettingsService.testSettings(
      req.user.userId,
      body.settings,
      body.message,
    );
  }

  /**
   * 채팅 모드를 변경합니다.
   */
  @Post('switch-mode')
  async switchChatMode(
    @Request() req: AuthenticatedRequest,
    @Body() body: { mode: ChatMode },
  ) {
    return this.aiSettingsService.switchChatMode(req.user.userId, body.mode);
  }

  /**
   * 사용 가능한 채팅 모드를 조회합니다.
   */
  @Get('available-modes')
  async getAvailableModes(@Request() req: AuthenticatedRequest) {
    const availableModes = await this.aiSettingsService.getAvailableChatModes(
      req.user.userId,
    );
    return { availableModes };
  }

  /**
   * 기업 설정을 업데이트합니다.
   */
  @Put('business-settings')
  async updateBusinessSettings(
    @Request() req: AuthenticatedRequest,
    @Body() businessSettings: AiSettings['businessSettings'],
  ) {
    return this.aiSettingsService.updateBusinessSettings(
      req.user.userId,
      businessSettings,
    );
  }
}
