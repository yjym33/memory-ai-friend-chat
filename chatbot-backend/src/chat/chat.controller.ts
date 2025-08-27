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
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as Tesseract from 'tesseract.js';
import * as textract from 'textract';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';

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
  ) {}

  /**
   * 사용자의 모든 대화 목록을 조회합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Get('conversations')
  async getAllConversations(@Request() req) {
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
  async createConversation(@Request() req) {
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
  async simpleChat(@Body() body: { message: string }, @Request() req) {
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
    @Body() body: { message: string; file?: any },
    @Request() req,
  ) {
    try {
      // 1. 사용자의 AI 설정 조회
      const aiSettings = await this.aiSettingsService.findByUserId(
        req.user.userId,
      );

      // 2. 에이전트를 통한 메시지 처리 (감정 분석 및 목표 추출)
      const agentResponse = await this.agentService.processMessage(
        req.user.userId,
        body.message,
      );

      // 3. 대화 내용 업데이트
      const conversation =
        await this.chatService.getConversation(conversationId);
      const updatedMessages = [
        ...conversation.messages,
        { role: 'user', content: body.message },
        { role: 'assistant', content: agentResponse },
      ];

      await this.chatService.updateConversation(
        conversationId,
        updatedMessages,
      );

      // 4. AI 응답 반환
      return {
        role: 'assistant',
        content: agentResponse,
      };
    } catch (error) {
      console.error('Chat completion error:', error);
      return {
        role: 'assistant',
        content: '죄송해요, 처리 중 오류가 발생했습니다. 다시 말씀해 주세요.',
      };
    }
  }
}
