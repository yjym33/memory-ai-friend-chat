import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  NotFoundException,
  Put,
  Request,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/request.types';
import { ConversationService } from './conversation.service';
import { ChatMessage, ConversationTheme } from './types/chat.types';

/**
 * 대화 관리 API를 처리하는 컨트롤러
 * 대화 생성, 조회, 수정, 삭제(CRUD) 기능을 담당합니다.
 */
@Controller('chat/conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  private readonly logger = new Logger('ConversationController');

  constructor(private readonly conversationService: ConversationService) {
    this.logger.debug(
      '[ConversationController] Constructor 실행 - 대화 관리 컨트롤러 초기화',
    );
  }

  /**
   * 사용자의 모든 대화 목록을 조회합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Get()
  async getAllConversations(@Request() req: AuthenticatedRequest) {
    this.logger.debug(
      `[getAllConversations] 호출 - userId: ${req.user.userId}`,
    );
    const result = await this.conversationService.getAllConversations(
      req.user.userId,
    );
    this.logger.debug(
      `[getAllConversations] 완료 - 대화 개수: ${result.length}`,
    );
    return result;
  }

  /**
   * 특정 대화의 상세 정보를 조회합니다.
   * @param id - 대화 ID
   */
  @Get(':id')
  async getConversation(@Param('id') id: number) {
    this.logger.debug(`[getConversation] 호출 - conversationId: ${id}`);
    const result = await this.conversationService.getConversation(id);
    if (!result) throw new NotFoundException('대화를 찾을 수 없습니다.');
    this.logger.debug(`[getConversation] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 새로운 대화를 생성합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post()
  async createConversation(@Request() req: AuthenticatedRequest) {
    this.logger.debug(`[createConversation] 호출 - userId: ${req.user.userId}`);
    const result = await this.conversationService.createConversation(
      req.user.userId,
    );
    this.logger.debug(
      `[createConversation] 완료 - 새로운 대화 ID: ${result.id}`,
    );
    return result;
  }

  /**
   * 대화 내용을 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 업데이트할 메시지 배열
   */
  @Put(':id')
  async updateConversation(
    @Param('id') id: number,
    @Body() body: { messages: ChatMessage[] },
  ) {
    this.logger.debug(
      `[updateConversation] 호출 - conversationId: ${id}, 메시지 개수: ${body.messages.length}`,
    );
    const result = await this.conversationService.updateConversation(
      id,
      body.messages,
    );
    this.logger.debug(`[updateConversation] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화 제목을 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 새로운 제목
   */
  @Put(':id/title')
  async updateConversationTitle(
    @Param('id') id: number,
    @Body() body: { title: string },
  ) {
    this.logger.debug(
      `[updateConversationTitle] 호출 - conversationId: ${id}, title: ${body.title}`,
    );
    const result = await this.conversationService.updateConversationTitle(
      id,
      body.title,
    );
    this.logger.debug(`[updateConversationTitle] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화의 고정 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 고정 상태
   */
  @Put(':id/pin')
  async updateConversationPin(
    @Param('id') id: number,
    @Body() body: { pinned: boolean },
  ) {
    this.logger.debug(
      `[updateConversationPin] 호출 - conversationId: ${id}, pinned: ${body.pinned}`,
    );
    const result = await this.conversationService.updateConversationPin(
      id,
      body.pinned,
    );
    this.logger.debug(`[updateConversationPin] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화의 보관 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 보관 상태
   */
  @Put(':id/archive')
  async updateConversationArchive(
    @Param('id') id: number,
    @Body() body: { archived: boolean },
  ) {
    this.logger.debug(
      `[updateConversationArchive] 호출 - conversationId: ${id}, archived: ${body.archived}`,
    );
    const result = await this.conversationService.updateConversationArchive(
      id,
      body.archived,
    );
    this.logger.debug(
      `[updateConversationArchive] 완료 - conversationId: ${id}`,
    );
    return result;
  }

  /**
   * 대화의 테마를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 테마 설정
   */
  @Put(':id/theme')
  async updateConversationTheme(
    @Param('id') id: number,
    @Body() body: { theme: ConversationTheme; themeName: string },
  ) {
    this.logger.debug(
      `[updateConversationTheme] 호출 - conversationId: ${id}, themeName: ${body.themeName}`,
    );
    const result = await this.conversationService.updateConversationTheme(
      id,
      body.theme,
      body.themeName,
    );
    this.logger.debug(`[updateConversationTheme] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화의 테마를 조회합니다.
   * @param id - 대화 ID
   */
  @Get(':id/theme')
  async getConversationTheme(@Param('id') id: number) {
    this.logger.debug(`[getConversationTheme] 호출 - conversationId: ${id}`);
    const result = await this.conversationService.getConversationTheme(id);
    this.logger.debug(`[getConversationTheme] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화를 삭제합니다.
   * @param id - 대화 ID
   */
  @Delete(':id')
  async deleteConversation(@Param('id') id: number) {
    this.logger.debug(`[deleteConversation] 호출 - conversationId: ${id}`);
    try {
      await this.conversationService.deleteConversation(id);
      this.logger.debug(`[deleteConversation] 완료 - conversationId: ${id}`);
      return { message: '대화가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      this.logger.error(
        `[deleteConversation] 실패 - conversationId: ${id}`,
        error,
      );
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
  }
}
