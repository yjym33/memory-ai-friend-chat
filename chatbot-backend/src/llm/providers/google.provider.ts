import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProvider,
} from '../types/llm.types';

/**
 * Google Gemini Provider 구현
 * Google Gemini API를 사용하여 LLM 응답을 생성합니다.
 */
@Injectable()
export class GoogleProvider implements ILLMProvider {
  private readonly logger = new Logger(GoogleProvider.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    this.logger.debug(
      '[GoogleProvider] Constructor 실행 - Google Gemini Provider 초기화',
    );
    // 기본 API 키는 환경 변수에서 가져옴
    const defaultApiKey =
      this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(defaultApiKey);
    this.logger.debug('[GoogleProvider] GoogleGenerativeAI 클라이언트 생성 완료');
  }

  /**
   * 사용자별 API 키로 GoogleGenerativeAI 인스턴스를 생성합니다.
   */
  private createGenAI(apiKey?: string): GoogleGenerativeAI {
    const key = apiKey || this.configService.get<string>('GOOGLE_API_KEY') || '';
    return new GoogleGenerativeAI(key);
  }

  getName(): string {
    return LLMProvider.GOOGLE;
  }

  getDefaultModel(): string {
    return 'gemini-3.1-pro-preview';
  }

  getAvailableModels(): string[] {
    return [
      'gemini-3.1-pro-preview',
      'gemini-3-flash',
    ];
  }

  validateModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  async generateResponse(
    request: LLMRequest,
    apiKey?: string,
  ): Promise<LLMResponse> {
    try {
      const genAI = this.createGenAI(apiKey);
      
      // 시스템 메시지 추출 (Gemini 1.5+ 모델용 systemInstruction 활용)
      const systemMessage = request.messages.find((m) => m.role === 'system')?.content;
      
      // 일반 대화 내역 (시스템 메시지 제외)
      const chatMessages = request.messages.filter((m) => m.role !== 'system');
      
      // 대화 히스토리 구성 (마지막 메시지 제외)
      const history = chatMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      
      const lastMessage = chatMessages[chatMessages.length - 1];

      const model = genAI.getGenerativeModel({
        model: request.model,
        systemInstruction: systemMessage,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4000, // 최대 출력 상향
          topP: request.topP,
          topK: request.topK,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      // 대화 시작 및 메시지 전송
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(lastMessage.content);
      const response = result.response;
      let text = '';
      try {
        text = response.text();
      } catch (e) {
        this.logger.warn('Gemini response.text() 실패 (차단된 컨텐츠 가능성):', e);
        text = '응답을 생성하는 도중 정책 위반 등의 사유로 중단되었습니다.';
      }

      // 사용량 정보 추출 (가능한 경우)
      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined;

      return {
        content: text,
        model: request.model,
        usage,
        finishReason: response.candidates?.[0]?.finishReason || undefined,
      };
    } catch (error) {
      this.logger.error('Google Gemini API 호출 실패:', error);
      throw new Error(`Google Gemini API 호출 실패: ${error.message}`);
    }
  }

  async generateStreamingResponse(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    apiKey?: string,
  ): Promise<void> {
    try {
      const genAI = this.createGenAI(apiKey);
      
      // 시스템 메시지 추출
      const systemMessage = request.messages.find((m) => m.role === 'system')?.content;
      
      // 일반 대화 내역
      const chatMessages = request.messages.filter((m) => m.role !== 'system');
      
      // 히스토리 구성
      const history = chatMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));
      
      const lastMessage = chatMessages[chatMessages.length - 1];

      const model = genAI.getGenerativeModel({
        model: request.model,
        systemInstruction: systemMessage,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 4000,
          topP: request.topP,
          topK: request.topK,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(lastMessage.content);

      for await (const chunk of result.stream) {
        try {
          const text = chunk.text();
          if (text) {
            onChunk({
              content: text,
              done: false,
            });
          }
        } catch (e) {
          this.logger.warn('스트리밍 중 에러 발생 (안전 필터 등):', e);
          // 일부 청크가 차단되더라도 스트림 전체를 끊지 않도록 처리
        }
      }

      // 스트림 완료
      const response = await result.response;
      const usage = response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount,
            completionTokens: response.usageMetadata.candidatesTokenCount,
            totalTokens: response.usageMetadata.totalTokenCount,
          }
        : undefined;

      onChunk({
        content: '',
        done: true,
        usage,
      });
    } catch (error) {
      this.logger.error('Google Gemini 스트리밍 API 호출 실패:', error);
      throw new Error(`Google Gemini 스트리밍 API 호출 실패: ${error.message}`);
    }
  }


}

