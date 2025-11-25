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
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { AuthenticatedRequest } from '../common/types/request.types';
import { FileExtractionService } from '../common/services/file-extraction.service';
import {
  SSE_EVENT_TYPES,
  ERROR_MESSAGES,
} from '../common/constants/llm.constants';
import {
  validateConversationExists,
  createUpdatedMessages,
  formatSseEvent,
} from '../common/utils/conversation.utils';

/**
 * 채팅 관련 API를 처리하는 컨트롤러
 * 대화 관리 및 AI 응답 생성을 담당합니다.
 */
@Controller('chat')
@UseGuards(JwtAuthGuard) // JWT 인증이 필요한 모든 엔드포인트
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private configService: ConfigService,
    private readonly aiSettingsService: AiSettingsService,
    private readonly agentService: AgentService,
    private readonly fileExtractionService: FileExtractionService,
  ) {}

  /**
   * 사용자의 모든 대화 목록을 조회합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Get('conversations')
  async getAllConversations(@Request() req: AuthenticatedRequest) {
    return this.chatService.getAllConversations(req.user.userId);
  }

  /**
   * 특정 대화의 상세 정보를 조회합니다.
   * @param id - 대화 ID
   */
  @Get('conversations/:id')
  async getConversation(@Param('id') id: number) {
    return this.chatService.getConversation(id);
  }

  /**
   * 새로운 대화를 생성합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post('conversations')
  async createConversation(@Request() req: AuthenticatedRequest) {
    return this.chatService.createConversation(req.user.userId);
  }

  /**
   * 대화 내용을 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 업데이트할 메시지 배열
   */
  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: number,
    @Body() body: { messages: any[] },
  ) {
    return this.chatService.updateConversation(id, body.messages);
  }

  /**
   * 대화 제목을 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 새로운 제목
   */
  @Put('conversations/:id/title')
  async updateConversationTitle(
    @Param('id') id: number,
    @Body() body: { title: string },
  ) {
    return this.chatService.updateConversationTitle(id, body.title);
  }

  /**
   * 대화의 고정 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 고정 상태
   */
  @Put('conversations/:id/pin')
  async updateConversationPin(
    @Param('id') id: number,
    @Body() body: { pinned: boolean },
  ) {
    return this.chatService.updateConversationPin(id, body.pinned);
  }

  /**
   * 대화의 보관 상태를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 보관 상태
   */
  @Put('conversations/:id/archive')
  async updateConversationArchive(
    @Param('id') id: number,
    @Body() body: { archived: boolean },
  ) {
    return this.chatService.updateConversationArchive(id, body.archived);
  }

  /**
   * 대화의 테마를 업데이트합니다.
   * @param id - 대화 ID
   * @param body - 테마 설정
   */
  @Put('conversations/:id/theme')
  async updateConversationTheme(
    @Param('id') id: number,
    @Body() body: { theme: any; themeName: string },
  ) {
    return this.chatService.updateConversationTheme(
      id,
      body.theme,
      body.themeName,
    );
  }

  /**
   * 대화의 테마를 조회합니다.
   * @param id - 대화 ID
   */
  @Get('conversations/:id/theme')
  async getConversationTheme(@Param('id') id: number) {
    return this.chatService.getConversationTheme(id);
  }

  /**
   * 대화를 삭제합니다.
   * @param id - 대화 ID
   */
  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: number) {
    try {
      await this.chatService.deleteConversation(id);
      return { message: '대화가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
  }

  /**
   * 단순 채팅 메시지 처리 (테스트용)
   * @param body - 사용자 메시지
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post()
  async simpleChat(
    @Body() body: { message: string },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // 에이전트를 통한 메시지 처리 (감정 분석 및 목표 추출)
      const agentResponse = await this.agentService.processMessage(
        req.user.userId,
        body.message,
      );

      return {
        response: agentResponse,
      };
    } catch (error) {
      console.error('Simple chat error:', error);
      return {
        response: '죄송해요, 처리 중 오류가 발생했습니다. 다시 말씀해 주세요.',
      };
    }
  }

  /**
   * AI와의 대화를 처리하고 응답을 생성합니다.
   * @param conversationId - 대화 ID
   * @param body - 사용자 메시지와 파일(선택)
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post('completion/:conversationId')
  async chatCompletion(
    @Param('conversationId') conversationId: number,
    @Body()
    body: { message: string; file?: any; mode?: 'personal' | 'business' },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // 1) 기업/개인 모드 메시지 처리 (ChatService)
      const { response, sources } = await this.chatService.processMessage(
        req.user.userId,
        conversationId,
        body.message,
      );

      // 2) 대화 내용 업데이트
      const conversation =
        await this.chatService.getConversation(conversationId);
      if (!conversation) {
        throw new NotFoundException('대화를 찾을 수 없습니다.');
      }
      const updatedMessages = [
        ...conversation.messages,
        { role: 'user' as const, content: body.message },
        // 응답에 출처 포함
        { role: 'assistant' as const, content: response, sources },
      ];

      await this.chatService.updateConversation(
        conversationId,
        updatedMessages,
      );

      // 3) 응답 반환 (출처 포함)
      return {
        role: 'assistant',
        content: response,
        sources: sources || [],
      };
    } catch (error) {
      console.error('Chat completion error:', error);
      return {
        role: 'assistant',
        content: '죄송해요, 처리 중 오류가 발생했습니다. 다시 말씀해 주세요.',
      };
    }
  }

  /**
   * AI와의 대화를 스트리밍 방식으로 처리합니다.
   * @param conversationId - 대화 ID
   * @param body - 사용자 메시지
   * @param req - 요청 객체 (사용자 ID 포함)
   * @param res - 응답 객체
   */
  @Post('completion/:conversationId/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async chatCompletionStream(
    @Param('conversationId') conversationId: number,
    @Body() body: { message: string },
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // SSE 헤더 설정
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화

      // 전체 응답을 저장할 변수
      let fullResponse = '';
      let responseSources: any[] = [];
      let responseImages: string[] = [];
      let responseImageMetadata: any = null;

      // 스트리밍 방식으로 메시지 처리
      const result = await this.chatService.processMessageStream(
        req.user.userId,
        conversationId,
        body.message,
        (chunk: string) => {
          fullResponse += chunk;
          res.write(formatSseEvent(SSE_EVENT_TYPES.TOKEN, chunk));
        },
        (sources: any[]) => {
          responseSources = sources;
          res.write(formatSseEvent(SSE_EVENT_TYPES.SOURCES, sources));
        },
      );

      // 이미지 생성 결과가 있으면 처리
      if (result?.images && result.images.length > 0) {
        responseImages = result.images;
        responseImageMetadata = result.imageMetadata;
        // 이미지 정보를 SSE로 전송
        res.write(formatSseEvent(SSE_EVENT_TYPES.IMAGES, {
          images: responseImages,
          imageMetadata: responseImageMetadata,
        }));
      }

      // 대화 내용을 데이터베이스에 저장
      const conversation =
        await this.chatService.getConversation(conversationId);
      
      const validatedConversation = validateConversationExists(
        conversation,
        conversationId,
      );

      // 메시지 업데이트 (이미지 정보 포함)
      const updatedMessages = [
        ...validatedConversation.messages,
        { role: 'user' as const, content: body.message },
        {
          role: 'assistant' as const,
          content: fullResponse,
          sources: responseSources,
          ...(responseImages.length > 0 && {
            images: responseImages,
            imageMetadata: responseImageMetadata,
            messageType: 'image' as const,
          }),
        },
      ];

      await this.chatService.updateConversation(
        conversationId,
        updatedMessages,
      );

      // 스트리밍 완료
      res.write(formatSseEvent(SSE_EVENT_TYPES.DONE, null));
      res.end();
    } catch (error) {
      console.error('Chat streaming error:', error);
      res.write(
        formatSseEvent(SSE_EVENT_TYPES.ERROR, ERROR_MESSAGES.GENERAL_ERROR),
      );
      res.end();
    }
  }

  /**
   * 파일 내용을 추출하는 메서드 (FileExtractionService 위임)
   * @deprecated FileExtractionService를 직접 사용하세요
   */
  private async extractFileContent(filePath: string): Promise<string> {
    return this.fileExtractionService.extractContent(filePath);
  }

  /**
   * 파일 내용에서 핵심 정보만 추출하는 메서드 (FileExtractionService 위임)
   * @deprecated FileExtractionService를 직접 사용하세요
   */
  private extractKeyContent(content: string, filename: string): string {
    return this.fileExtractionService.extractKeyContent(content, filename);
  }
}
