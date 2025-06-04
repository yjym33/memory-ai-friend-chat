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

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private configService: ConfigService,
    private readonly aiSettingsService: AiSettingsService,
    private readonly agentService: AgentService,
  ) {}

  @Get('conversations')
  async getAllConversations(@Request() req) {
    return this.chatService.getAllConversations(req.user.userId);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: number) {
    return this.chatService.getConversation(id);
  }

  @Post('conversations')
  async createConversation(@Request() req) {
    return this.chatService.createConversation(req.user.userId);
  }

  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: number,
    @Body() body: { messages: any[] },
  ) {
    return this.chatService.updateConversation(id, body.messages);
  }

  @Put('conversations/:id/title')
  async updateConversationTitle(
    @Param('id') id: number,
    @Body() body: { title: string },
  ) {
    return this.chatService.updateConversationTitle(id, body.title);
  }

  @Put('conversations/:id/pin')
  async updateConversationPin(
    @Param('id') id: number,
    @Body() body: { pinned: boolean },
  ) {
    return this.chatService.updateConversationPin(id, body.pinned);
  }

  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: number) {
    try {
      await this.chatService.deleteConversation(id);
      return { message: '대화가 성공적으로 삭제되었습니다.' };
    } catch (error) {
      throw new NotFoundException('대화를 찾을 수 없습니다.');
    }
  }

  @Post('completion/:conversationId')
  async chatCompletion(
    @Param('conversationId') conversationId: number,
    @Body() body: { message: string; file?: any },
    @Request() req,
  ) {
    try {
      // 기존 AI 설정 조회
      const aiSettings = await this.aiSettingsService.findByUserId(
        req.user.userId,
      );

      // 🌟 에이전트 처리 (감정 분석 및 목표 추출)
      const agentResponse = await this.agentService.processMessage(
        req.user.userId,
        body.message,
      );

      // 기존 대화 저장 로직
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
