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
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSettingsService } from '../ai-settings/ai-settings.service';
import { AgentService } from '../agent/agent.service';
import { AuthenticatedRequest } from '../common/types/request.types';
import { FileExtractionService } from '../common/services/file-extraction.service';
import { LLMOrchestratorService } from '../llm/services/llm-orchestrator.service';
import { ImageOrchestratorService } from '../image-generation/services/image-orchestrator.service';
import { LLMProvider } from '../llm/types/llm.types';
import { ImageProvider } from '../image-generation/types/image.types';
import {
  SSE_EVENT_TYPES,
  ERROR_MESSAGES,
} from '../common/constants/llm.constants';
import {
  validateConversationExists,
  createUpdatedMessages,
  formatSseEvent,
} from '../common/utils/conversation.utils';
import {
  ChatMessage,
  ConversationTheme,
  DocumentSource,
  ImageMetadata,
  ChatCompletionRequest,
} from './types/chat.types';

/**
 * 채팅 관련 API를 처리하는 컨트롤러
 * 대화 관리 및 AI 응답 생성을 담당합니다.
 */
@Controller('chat')
@UseGuards(JwtAuthGuard) // JWT 인증이 필요한 모든 엔드포인트
export class ChatController {
  private readonly logger = new Logger('ChatController');

  constructor(
    private readonly chatService: ChatService,
    private configService: ConfigService,
    private readonly aiSettingsService: AiSettingsService,
    private readonly agentService: AgentService,
    private readonly fileExtractionService: FileExtractionService,
    private readonly orchestratorService: LLMOrchestratorService,
    private readonly imageOrchestratorService: ImageOrchestratorService,
  ) {
    this.logger.debug(
      '[ChatController] Constructor 실행 - 채팅 컨트롤러 초기화',
    );
  }

  /**
   * 사용자의 모든 대화 목록을 조회합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Get('conversations')
  async getAllConversations(@Request() req: AuthenticatedRequest) {
    this.logger.debug(
      `[getAllConversations] 호출 - userId: ${req.user.userId}`,
    );
    const result = await this.chatService.getAllConversations(req.user.userId);
    this.logger.debug(
      `[getAllConversations] 완료 - 대화 개수: ${result.length}`,
    );
    return result;
  }

  /**
   * 특정 대화의 상세 정보를 조회합니다.
   * @param id - 대화 ID
   */
  @Get('conversations/:id')
  async getConversation(@Param('id') id: number) {
    this.logger.debug(`[getConversation] 호출 - conversationId: ${id}`);
    const result = await this.chatService.getConversation(id);
    this.logger.debug(`[getConversation] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 새로운 대화를 생성합니다.
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post('conversations')
  async createConversation(@Request() req: AuthenticatedRequest) {
    this.logger.debug(`[createConversation] 호출 - userId: ${req.user.userId}`);
    const result = await this.chatService.createConversation(req.user.userId);
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
  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: number,
    @Body() body: { messages: ChatMessage[] },
  ) {
    this.logger.debug(
      `[updateConversation] 호출 - conversationId: ${id}, 메시지 개수: ${body.messages.length}`,
    );
    const result = await this.chatService.updateConversation(id, body.messages);
    this.logger.debug(`[updateConversation] 완료 - conversationId: ${id}`);
    return result;
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
    this.logger.debug(
      `[updateConversationTitle] 호출 - conversationId: ${id}, title: ${body.title}`,
    );
    const result = await this.chatService.updateConversationTitle(
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
  @Put('conversations/:id/pin')
  async updateConversationPin(
    @Param('id') id: number,
    @Body() body: { pinned: boolean },
  ) {
    this.logger.debug(
      `[updateConversationPin] 호출 - conversationId: ${id}, pinned: ${body.pinned}`,
    );
    const result = await this.chatService.updateConversationPin(
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
  @Put('conversations/:id/archive')
  async updateConversationArchive(
    @Param('id') id: number,
    @Body() body: { archived: boolean },
  ) {
    this.logger.debug(
      `[updateConversationArchive] 호출 - conversationId: ${id}, archived: ${body.archived}`,
    );
    const result = await this.chatService.updateConversationArchive(
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
  @Put('conversations/:id/theme')
  async updateConversationTheme(
    @Param('id') id: number,
    @Body() body: { theme: ConversationTheme; themeName: string },
  ) {
    this.logger.debug(
      `[updateConversationTheme] 호출 - conversationId: ${id}, themeName: ${body.themeName}`,
    );
    const result = await this.chatService.updateConversationTheme(
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
  @Get('conversations/:id/theme')
  async getConversationTheme(@Param('id') id: number) {
    this.logger.debug(`[getConversationTheme] 호출 - conversationId: ${id}`);
    const result = await this.chatService.getConversationTheme(id);
    this.logger.debug(`[getConversationTheme] 완료 - conversationId: ${id}`);
    return result;
  }

  /**
   * 대화를 삭제합니다.
   * @param id - 대화 ID
   */
  @Delete('conversations/:id')
  async deleteConversation(@Param('id') id: number) {
    this.logger.debug(`[deleteConversation] 호출 - conversationId: ${id}`);
    try {
      await this.chatService.deleteConversation(id);
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
    @Body() body: ChatCompletionRequest,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.debug(
      `[chatCompletion] 호출 - conversationId: ${conversationId}, userId: ${req.user.userId}, message: ${body.message.substring(0, 50)}...`,
    );
    try {
      // 1) 기업/개인 모드 메시지 처리 (ChatService)
      this.logger.debug(`[chatCompletion] ChatService.processMessage 호출`);
      const { response, sources } = await this.chatService.processMessage(
        req.user.userId,
        conversationId,
        body.message,
      );
      this.logger.debug(
        `[chatCompletion] ChatService.processMessage 완료 - response length: ${response.length}`,
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
      this.logger.debug(
        `[chatCompletion] 완료 - conversationId: ${conversationId}`,
      );
      return {
        role: 'assistant',
        content: response,
        sources: sources || [],
      };
    } catch (error) {
      this.logger.error(
        `[chatCompletion] 에러 - conversationId: ${conversationId}`,
        error,
      );
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
    this.logger.debug(
      `[chatCompletionStream] 호출 - conversationId: ${conversationId}, userId: ${req.user.userId}`,
    );
    try {
      // SSE 헤더 설정
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화

      // 전체 응답을 저장할 변수
      let fullResponse = '';
      let responseSources: DocumentSource[] = [];
      let responseImages: string[] = [];
      let responseImageMetadata: ImageMetadata | undefined = undefined;

      // 스트리밍 방식으로 메시지 처리
      const result = await this.chatService.processMessageStream(
        req.user.userId,
        conversationId,
        body.message,
        (chunk: string) => {
          fullResponse += chunk;
          res.write(formatSseEvent(SSE_EVENT_TYPES.TOKEN, chunk));
        },
        (sources: DocumentSource[]) => {
          responseSources = sources;
          res.write(formatSseEvent(SSE_EVENT_TYPES.SOURCES, sources));
        },
      );

      // 이미지 생성 결과가 있으면 처리
      if (result?.images && result.images.length > 0) {
        responseImages = result.images;
        responseImageMetadata = result.imageMetadata;
        // 이미지 정보를 SSE로 전송
        res.write(
          formatSseEvent(SSE_EVENT_TYPES.IMAGES, {
            images: responseImages,
            imageMetadata: responseImageMetadata,
          }),
        );
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

  // =====================================
  // Multi-Model Orchestrator 엔드포인트
  // =====================================

  /**
   * 사용 가능한 Provider 목록을 조회합니다.
   */
  @Get('multi-model/providers')
  async getAvailableProviders() {
    return {
      providers: this.orchestratorService.getProviderInfo(),
      available: this.orchestratorService.getAvailableProviders(),
    };
  }

  /**
   * 여러 AI 모델을 동시에 호출하여 복수의 응답을 받습니다.
   * 이미지 생성 요청인 경우 여러 이미지 Provider를 사용하여 복수의 이미지를 생성합니다.
   * @param conversationId - 대화 ID
   * @param body - 메시지와 사용할 Provider 목록
   * @param req - 요청 객체 (사용자 ID 포함)
   */
  @Post('completion/:conversationId/multi')
  async multiModelCompletion(
    @Param('conversationId') conversationId: number,
    @Body()
    body: {
      message: string;
      providers: string[]; // LLM: ['openai', 'anthropic', 'google']
      imageProviders?: string[]; // Image: ['dalle', 'stability', 'google-imagen']
    },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // 이미지 생성 요청인지 확인
      if (this.chatService.isImageGenerationRequest(body.message)) {
        console.log('🎨 Multi-Model 모드에서 이미지 생성 요청 감지');

        // 이미지 Provider 파싱
        const imageProviders = body.imageProviders
          ? body.imageProviders
              .map((p) => this.parseImageProvider(p))
              .filter((p): p is ImageProvider => p !== null)
          : this.imageOrchestratorService.getAvailableProviders();

        if (imageProviders.length === 0) {
          return {
            success: false,
            error: '사용 가능한 이미지 Provider가 없습니다.',
          };
        }

        // 프롬프트 추출
        const prompt = this.chatService.extractImagePrompt(body.message);

        console.log(
          `🖼️ ${imageProviders.length}개 이미지 Provider로 생성 시작: ${prompt}`,
        );

        // 여러 이미지 Provider로 동시 생성
        const multiImageResult =
          await this.imageOrchestratorService.generateMultiImages({
            providers: imageProviders,
            prompt,
          });

        // 성공한 이미지들 수집
        const allImages: string[] = [];
        const imageMetadata: Array<{
          provider: string;
          model: string;
          url: string;
        }> = [];

        multiImageResult.responses.forEach((response) => {
          if (response.success && response.images.length > 0) {
            response.images.forEach((img) => {
              allImages.push(img.url);
              imageMetadata.push({
                provider: response.provider,
                model: response.model,
                url: img.url,
              });
            });
          }
        });

        const responseText =
          multiImageResult.successCount > 0
            ? `🎨 ${multiImageResult.successCount}개의 AI가 "${prompt}" 이미지를 생성했습니다! 마음에 드는 것을 선택해주세요.`
            : '이미지 생성에 실패했습니다. 다시 시도해주세요.';

        return {
          success: true,
          isImageGeneration: true,
          isMultiImage: true,
          response: responseText,
          prompt,
          images: allImages,
          imageMetadata,
          multiImageResponses: multiImageResult.responses,
          totalLatency: multiImageResult.totalLatency,
          successCount: multiImageResult.successCount,
          failCount: multiImageResult.failCount,
        };
      }

      // Provider 문자열을 enum으로 변환
      const providers = body.providers
        .map((p) => this.parseProvider(p))
        .filter((p): p is LLMProvider => p !== null);

      if (providers.length === 0) {
        return {
          success: false,
          error: '유효한 Provider가 없습니다.',
        };
      }

      // Multi-Model 응답 생성
      const result = await this.orchestratorService.generateMultiModelResponses(
        {
          providers,
          messages: [{ role: 'user', content: body.message }],
        },
      );

      return {
        success: true,
        isImageGeneration: false,
        ...result,
      };
    } catch (error) {
      console.error('Multi-model completion error:', error);
      return {
        success: false,
        error: error.message || '처리 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 이미지 Provider 문자열을 ImageProvider enum으로 변환합니다.
   */
  private parseImageProvider(provider: string): ImageProvider | null {
    const normalized = provider.toLowerCase();
    switch (normalized) {
      case 'dalle':
      case 'dall-e':
      case 'openai':
        return ImageProvider.DALLE;
      case 'stability':
      case 'stable-diffusion':
      case 'sd':
        return ImageProvider.STABILITY;
      case 'google-imagen':
      case 'gemini':
      case 'imagen':
        return ImageProvider.GOOGLE_IMAGEN;
      default:
        return null;
    }
  }

  /**
   * 여러 AI 모델의 응답을 스트리밍 방식으로 받습니다.
   * 각 Provider별로 개별 스트림이 전송됩니다.
   */
  @Post('completion/:conversationId/multi/stream')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async multiModelCompletionStream(
    @Param('conversationId') conversationId: number,
    @Body()
    body: {
      message: string;
      providers: string[];
    },
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const providers = body.providers
        .map((p) => this.parseProvider(p))
        .filter((p): p is LLMProvider => p !== null);

      if (providers.length === 0) {
        res.write(
          formatSseEvent(SSE_EVENT_TYPES.ERROR, '유효한 Provider가 없습니다.'),
        );
        res.end();
        return;
      }

      // 각 Provider별 응답을 저장
      const providerResponses: Record<string, string> = {};

      await this.orchestratorService.generateMultiModelStreams(
        {
          providers,
          messages: [{ role: 'user', content: body.message }],
        },
        // onChunk
        (provider: LLMProvider, chunk: string, model: string) => {
          if (!providerResponses[provider]) {
            providerResponses[provider] = '';
          }
          providerResponses[provider] += chunk;

          res.write(
            formatSseEvent('multi_token', {
              provider,
              model,
              chunk,
            }),
          );
        },
        // onComplete
        (provider: LLMProvider, model: string) => {
          res.write(
            formatSseEvent('multi_complete', {
              provider,
              model,
              content: providerResponses[provider] || '',
            }),
          );
        },
        // onError
        (provider: LLMProvider, error: string) => {
          res.write(
            formatSseEvent('multi_error', {
              provider,
              error,
            }),
          );
        },
      );

      res.write(formatSseEvent(SSE_EVENT_TYPES.DONE, null));
      res.end();
    } catch (error) {
      console.error('Multi-model streaming error:', error);
      res.write(
        formatSseEvent(SSE_EVENT_TYPES.ERROR, ERROR_MESSAGES.GENERAL_ERROR),
      );
      res.end();
    }
  }

  /**
   * 여러 AI 모델의 응답을 종합하여 합의 기반 응답을 생성합니다.
   */
  @Post('completion/:conversationId/consensus')
  async consensusCompletion(
    @Param('conversationId') conversationId: number,
    @Body()
    body: {
      message: string;
      providers?: string[];
    },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // 기본값: 모든 사용 가능한 Provider 사용
      const providers = body.providers
        ? body.providers
            .map((p) => this.parseProvider(p))
            .filter((p): p is LLMProvider => p !== null)
        : this.orchestratorService.getAvailableProviders();

      if (providers.length < 2) {
        return {
          success: false,
          error: '합의 응답을 생성하려면 최소 2개의 Provider가 필요합니다.',
        };
      }

      const result = await this.orchestratorService.generateConsensusResponse({
        providers,
        messages: [{ role: 'user', content: body.message }],
      });

      // 대화 저장
      const conversation =
        await this.chatService.getConversation(conversationId);
      if (conversation) {
        const updatedMessages = [
          ...conversation.messages,
          { role: 'user' as const, content: body.message },
          {
            role: 'assistant' as const,
            content: result.consensus,
            multiModelSources: result.sources.map((s) => ({
              provider: s.provider,
              model: s.model,
              latency: s.latency,
            })),
          },
        ];
        await this.chatService.updateConversation(
          conversationId,
          updatedMessages,
        );
      }

      return {
        success: true,
        consensus: result.consensus,
        sources: result.sources,
      };
    } catch (error) {
      console.error('Consensus completion error:', error);
      return {
        success: false,
        error: error.message || '처리 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 선택된 응답을 대화에 저장합니다.
   */
  @Post('completion/:conversationId/multi/select')
  async selectMultiModelResponse(
    @Param('conversationId') conversationId: number,
    @Body()
    body: {
      userMessage: string;
      selectedProvider: string;
      selectedModel: string;
      selectedContent: string;
      allResponses: Array<{
        provider: string;
        model: string;
        content: string;
        latency: number;
      }>;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const conversation =
        await this.chatService.getConversation(conversationId);

      if (!conversation) {
        throw new NotFoundException('대화를 찾을 수 없습니다.');
      }

      // 선택된 응답을 대화에 저장
      const updatedMessages = [
        ...conversation.messages,
        { role: 'user' as const, content: body.userMessage },
        {
          role: 'assistant' as const,
          content: body.selectedContent,
          selectedFrom: {
            provider: body.selectedProvider,
            model: body.selectedModel,
          },
          alternativeResponses: body.allResponses.filter(
            (r) => r.provider !== body.selectedProvider,
          ),
        },
      ];

      await this.chatService.updateConversation(
        conversationId,
        updatedMessages,
      );

      return {
        success: true,
        message: '응답이 저장되었습니다.',
      };
    } catch (error) {
      console.error('Select response error:', error);
      return {
        success: false,
        error: error.message || '저장 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * Provider 문자열을 LLMProvider enum으로 변환합니다.
   */
  private parseProvider(provider: string): LLMProvider | null {
    const normalized = provider.toLowerCase();
    switch (normalized) {
      case 'openai':
        return LLMProvider.OPENAI;
      case 'google':
      case 'gemini':
        return LLMProvider.GOOGLE;
      case 'anthropic':
      case 'claude':
        return LLMProvider.ANTHROPIC;
      default:
        return null;
    }
  }
}
