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

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private configService: ConfigService,
    private readonly aiSettingsService: AiSettingsService,
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

  @Post('completions')
  async chatCompletion(@Body() body: any, @Request() req) {
    try {
      console.log('🔍 디버깅 시작');
      console.log('📧 사용자 ID:', req.user?.userId);

      const llmApiUrl = this.configService.get<string>('LLM_API_URL');
      const { conversationId, uploadedFile, ...llmRequestBody } = body;

      // 🔥 사용자 AI 설정 조회 및 로깅
      let userSettings;
      try {
        userSettings = await this.aiSettingsService.findByUserId(
          req.user.userId,
        );
        console.log('✅ 사용자 AI 설정 조회 성공:', {
          personalityType: userSettings.personalityType,
          speechStyle: userSettings.speechStyle,
          emojiUsage: userSettings.emojiUsage,
          empathyLevel: userSettings.empathyLevel,
          nickname: userSettings.nickname,
        });
      } catch (error) {
        console.error('❌ AI 설정 조회 실패:', error);
        // 기본 설정 사용
        userSettings = {
          personalityType: '친근함',
          speechStyle: '반말',
          emojiUsage: 3,
          empathyLevel: 3,
          nickname: '친구',
          memoryPriorities: { personal: 5, hobby: 4, work: 3, emotion: 5 },
          userProfile: { interests: [], currentGoals: [], importantDates: [] },
          avoidTopics: [],
        };
      }

      // 🔥 AI 설정을 LLM 요청에 포함
      llmRequestBody.aiSettings = {
        personalityType: userSettings.personalityType,
        speechStyle: userSettings.speechStyle,
        emojiUsage: userSettings.emojiUsage,
        empathyLevel: userSettings.empathyLevel,
        nickname: userSettings.nickname || '친구',
        memoryPriorities: userSettings.memoryPriorities || {},
        userProfile: userSettings.userProfile || {},
        avoidTopics: userSettings.avoidTopics || [],
      };

      console.log('📤 LLM으로 전달할 AI 설정:', llmRequestBody.aiSettings);

      if (uploadedFile?.path) {
        try {
          const filePath = path.join(process.cwd(), uploadedFile.path);
          let fileContent = '';
          const fileExt = path.extname(uploadedFile.originalName).toLowerCase();

          switch (fileExt) {
            case '.pdf':
              // PDF 파일 처리
              const dataBuffer = await fs.readFile(filePath);
              const pdfData = await pdf(dataBuffer);
              fileContent = pdfData.text;
              break;

            case '.doc':
            case '.docx':
              // Word 문서 처리
              const docResult = await mammoth.extractRawText({
                path: filePath,
              });
              fileContent = docResult.value;
              break;

            case '.xls':
            case '.xlsx':
              // 엑셀 파일 처리
              const workbook = XLSX.readFile(filePath);
              const sheetNames = workbook.SheetNames;
              let excelContent = '';

              sheetNames.forEach((sheetName) => {
                const worksheet = workbook.Sheets[sheetName];
                const sheetData = XLSX.utils.sheet_to_json(worksheet, {
                  header: 1,
                }) as any[][];

                excelContent += `\n[${sheetName}]\n`;
                sheetData.forEach((row) => {
                  if (Array.isArray(row)) {
                    excelContent += row.join('\t') + '\n';
                  } else {
                    excelContent += JSON.stringify(row) + '\n';
                  }
                });
              });
              fileContent = excelContent;
              break;

            case '.ppt':
            case '.pptx':
              // PPT 파일 처리
              try {
                fileContent = await new Promise((resolve, reject) => {
                  textract.extract(
                    filePath,
                    {
                      preserveLineBreaks: true,
                      preserveOnlyMultipleLineBreaks: true,
                    },
                    (error, text) => {
                      if (error) {
                        reject(error);
                      } else {
                        resolve(text);
                      }
                    },
                  );
                });
              } catch (error) {
                console.error('PPT 파일 처리 실패:', error);
                fileContent = '파워포인트 파일 처리 중 오류가 발생했습니다.';
              }
              break;

            case '.jpg':
            case '.jpeg':
            case '.png':
            case '.gif':
              // 이미지 파일 OCR 처리
              const {
                data: { text },
              } = await Tesseract.recognize(filePath, 'kor+eng');
              fileContent = text;
              break;

            case '.txt':
              // 텍스트 파일 처리
              fileContent = await fs.readFile(filePath, 'utf-8');
              break;

            default:
              throw new Error('지원하지 않는 파일 형식입니다.');
          }

          // 파일 내용을 시스템 메시지로 추가
          llmRequestBody.messages = [
            {
              role: 'system',
              content: `
                다음은 업로드된 파일(${uploadedFile.originalName})의 내용입니다:
                ---
                ${fileContent}
                ---
                위 문서 내용을 기반으로 사용자의 질문에 답변해주세요.
                답변 시 문서의 관련 내용을 인용하면서 설명해주세요.
              `,
            },
            ...llmRequestBody.messages,
          ];

          console.log(
            '📤 LLM 요청 데이터 (설정 포함):',
            JSON.stringify(
              {
                ...llmRequestBody,
                messages: llmRequestBody.messages.map((m) => ({
                  role: m.role,
                  content: m.content.substring(0, 100) + '...',
                })),
              },
              null,
              2,
            ),
          );

          const response = await axios.post(llmApiUrl, llmRequestBody, {
            headers: { 'Content-Type': 'application/json' },
          });

          console.log('✅ LLM 응답:', response.data);

          if (conversationId) {
            await this.chatService.updateConversation(conversationId, [
              ...llmRequestBody.messages,
              response.data.choices[0].message,
            ]);
          }

          return response.data;
        } catch (error) {
          console.error('파일 처리 실패:', error);
          throw new Error(`파일 처리 실패: ${error.message}`);
        }
      }

      console.log(
        '📤 LLM 요청 데이터 (설정 포함):',
        JSON.stringify(
          {
            ...llmRequestBody,
            messages: llmRequestBody.messages.map((m) => ({
              role: m.role,
              content: m.content.substring(0, 100) + '...',
            })),
          },
          null,
          2,
        ),
      );

      const response = await axios.post(llmApiUrl, llmRequestBody, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('✅ LLM 응답:', response.data);

      if (conversationId) {
        await this.chatService.updateConversation(conversationId, [
          ...llmRequestBody.messages,
          response.data.choices[0].message,
        ]);
      }

      return response.data;
    } catch (error) {
      console.error('❌ LLM 서버 요청 실패:', error);
      throw error;
    }
  }
}
