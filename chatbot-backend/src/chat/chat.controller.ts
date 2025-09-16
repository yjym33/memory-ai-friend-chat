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
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as Tesseract from 'tesseract.js';
import textract from 'textract';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { AuthenticatedRequest } from '../common/types/request.types';

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
    @Body() body: { message: string; file?: any },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // 1. 사용자의 AI 설정 조회
      const aiSettings = await this.aiSettingsService.findByUserId(
        req.user.userId,
      );

      // 2. 파일 처리 및 내용 추출
      let processedMessage = body.message;
      let fileContent = '';
      let userDisplayMessage = body.message; // 사용자에게 표시할 메시지

      if (body.file) {
        console.log('📎 파일 첨부됨:', body.file);

        try {
          // 파일 내용 추출
          fileContent = await this.extractFileContent(body.file.path);
          console.log(
            '📖 파일 내용 추출 완료:',
            fileContent.substring(0, 200) + '...',
          );

          // AI에게는 파일 내용의 핵심 부분만 전달
          const processedContent = this.extractKeyContent(
            fileContent,
            body.file.originalName,
          );

          processedMessage = `${body.message}\n\n📎 첨부파일: ${body.file.originalName}\n\n📄 파일 핵심 내용:\n${processedContent}`;

          // 사용자에게는 파일 첨부 정보만 표시
          userDisplayMessage = `${body.message}\n\n📎 첨부파일: ${body.file.originalName}`;
        } catch (error) {
          console.error('파일 내용 추출 실패:', error);
          processedMessage = `${body.message}\n\n📎 첨부파일: ${body.file.originalName}\n\n⚠️ 파일 내용을 읽을 수 없습니다.`;
          userDisplayMessage = `${body.message}\n\n📎 첨부파일: ${body.file.originalName}\n\n⚠️ 파일 내용을 읽을 수 없습니다.`;
        }
      }

      // 3. 에이전트를 통한 메시지 처리 (감정 분석 및 목표 추출)
      const agentResponse = await this.agentService.processMessage(
        req.user.userId,
        processedMessage,
      );

      // 4. 대화 내용 업데이트
      const conversation =
        await this.chatService.getConversation(conversationId);
      if (!conversation) {
        throw new NotFoundException('대화를 찾을 수 없습니다.');
      }
      const updatedMessages = [
        ...conversation.messages,
        { role: 'user' as const, content: userDisplayMessage }, // 사용자에게 표시할 메시지 사용
        { role: 'assistant' as const, content: agentResponse },
      ];

      await this.chatService.updateConversation(
        conversationId,
        updatedMessages,
      );

      // 사용자의 메모리 캐시 무효화 (새로운 대화 내용 반영)
      this.agentService.invalidateUserCache(req.user.userId);

      // 5. AI 응답 반환
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

  /**
   * 파일 내용을 추출하는 private 메서드
   * @param filePath - 파일 경로
   * @returns 추출된 텍스트 내용
   */
  private async extractFileContent(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();

    try {
      switch (extension) {
        case '.pdf':
          const pdfBuffer = await fs.readFile(filePath);
          const pdfData = await pdf(pdfBuffer);
          return pdfData.text;

        case '.docx':
          const docxBuffer = await fs.readFile(filePath);
          const docxResult = await mammoth.extractRawText({
            buffer: docxBuffer,
          });
          return docxResult.value;

        case '.xlsx':
          const xlsxBuffer = await fs.readFile(filePath);
          const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
          const sheetNames = workbook.SheetNames;
          let content = '';
          sheetNames.forEach((sheetName) => {
            const worksheet = workbook.Sheets[sheetName];
            content += `\n[${sheetName}]\n`;
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            content += JSON.stringify(jsonData, null, 2);
          });
          return content;

        case '.pptx':
          // PPTX는 복잡하므로 간단한 처리
          return '[PowerPoint 파일입니다. 내용을 텍스트로 추출할 수 없습니다.]';

        case '.txt':
          return await fs.readFile(filePath, 'utf8');

        default:
          return '[지원하지 않는 파일 형식입니다.]';
      }
    } catch (error) {
      console.error('파일 내용 추출 중 오류:', error);
      throw new Error('파일 내용을 읽을 수 없습니다.');
    }
  }

  /**
   * 파일 내용에서 핵심 정보만 추출하는 private 메서드
   * @param content - 전체 파일 내용
   * @param filename - 파일명
   * @returns 핵심 내용 요약
   */
  private extractKeyContent(content: string, filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();

    try {
      switch (extension) {
        case 'pdf':
          return this.extractPdfKeyContent(content);
        case 'docx':
        case 'doc':
          return this.extractDocKeyContent(content);
        case 'xlsx':
        case 'xls':
          return this.extractExcelKeyContent(content);
        case 'txt':
          return this.extractTextKeyContent(content);
        default:
          return this.extractTextKeyContent(content);
      }
    } catch (error) {
      console.error('핵심 내용 추출 중 오류:', error);
      return '[파일 내용을 분석할 수 없습니다.]';
    }
  }

  /**
   * PDF 파일의 핵심 내용 추출
   */
  private extractPdfKeyContent(content: string): string {
    // 제목, 요약, 목차, 결론 등 핵심 부분만 추출
    const lines = content.split('\n').filter((line) => line.trim());

    let keyContent = '';
    let isInKeySection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 제목 부분 (보통 처음 부분)
      if (
        i < 20 &&
        (line.includes('논문') ||
          line.includes('연구') ||
          line.includes('제목'))
      ) {
        keyContent += line + '\n';
        continue;
      }

      // 요약 부분
      if (
        line.includes('요지') ||
        line.includes('요약') ||
        line.includes('Abstract') ||
        line.includes('ABSTRACT')
      ) {
        isInKeySection = true;
        keyContent += '\n📋 ' + line + '\n';
        continue;
      }

      // 목차 부분
      if (
        line.includes('차례') ||
        line.includes('목차') ||
        line.includes('Contents')
      ) {
        isInKeySection = true;
        keyContent += '\n📑 ' + line + '\n';
        continue;
      }

      // 결론 부분
      if (
        line.includes('결론') ||
        line.includes('결론 및') ||
        line.includes('제4장')
      ) {
        isInKeySection = true;
        keyContent += '\n🎯 ' + line + '\n';
        continue;
      }

      // 핵심 섹션 내에서 중요한 내용만 추출
      if (
        isInKeySection &&
        line.length > 10 &&
        !line.includes('-') &&
        !line.includes('_')
      ) {
        if (keyContent.length < 2000) {
          // 최대 2000자로 제한
          keyContent += line + '\n';
        } else {
          break;
        }
      }

      // 섹션 구분자 만나면 핵심 섹션 종료
      if (line.includes('제') && line.includes('장') && line.length < 20) {
        isInKeySection = false;
      }
    }

    if (keyContent.length === 0) {
      // 핵심 내용을 찾지 못한 경우 앞부분 1000자만 반환
      return (
        content.substring(0, 1000) + '\n\n... (내용이 길어 일부만 표시됩니다)'
      );
    }

    return keyContent + '\n\n... (핵심 내용만 표시됩니다)';
  }

  /**
   * Word 문서의 핵심 내용 추출
   */
  private extractDocKeyContent(content: string): string {
    // Word 문서도 PDF와 유사하게 처리
    return this.extractPdfKeyContent(content);
  }

  /**
   * Excel 파일의 핵심 내용 추출
   */
  private extractExcelKeyContent(content: string): string {
    // Excel은 시트별로 데이터가 있으므로 첫 번째 시트의 주요 데이터만 반환
    const lines = content.split('\n');
    const keyLines = lines.slice(0, 50); // 처음 50줄만 반환

    return keyLines.join('\n') + '\n\n... (데이터가 많아 일부만 표시됩니다)';
  }

  /**
   * 텍스트 파일의 핵심 내용 추출
   */
  private extractTextKeyContent(content: string): string {
    if (content.length <= 2000) {
      return content;
    }

    // 텍스트가 길면 앞부분과 뒷부분을 조합
    const firstPart = content.substring(0, 1000);
    const lastPart = content.substring(content.length - 1000);

    return firstPart + '\n\n... (중간 내용 생략) ...\n\n' + lastPart;
  }
}
