import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
    return 'gemini-1.5-pro';
  }

  getAvailableModels(): string[] {
    return [
      'gemini-pro',
      'gemini-ultra',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
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
      const model = genAI.getGenerativeModel({
        model: request.model,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 1000,
          topP: request.topP,
          topK: request.topK,
        },
      });

      // Google Gemini 메시지 형식으로 변환
      const prompt = this.convertMessagesToPrompt(request.messages);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

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
      const model = genAI.getGenerativeModel({
        model: request.model,
        generationConfig: {
          temperature: request.temperature ?? 0.7,
          maxOutputTokens: request.maxTokens ?? 1000,
          topP: request.topP,
          topK: request.topK,
        },
      });

      // Google Gemini 메시지 형식으로 변환
      const prompt = this.convertMessagesToPrompt(request.messages);

      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          onChunk({
            content: text,
            done: false,
          });
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

  /**
   * OpenAI 형식의 메시지를 Google Gemini 형식으로 변환합니다.
   */
  private convertMessagesToPrompt(
    messages: Array<{ role: string; content: string }>,
  ): string {
    let prompt = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `[System]: ${msg.content}\n\n`;
      } else if (msg.role === 'user') {
        prompt += `[User]: ${msg.content}\n\n`;
      } else if (msg.role === 'assistant') {
        prompt += `[Assistant]: ${msg.content}\n\n`;
      }
    }

    // 마지막에 Assistant 응답을 요청
    if (messages[messages.length - 1]?.role !== 'assistant') {
      prompt += '[Assistant]:';
    }

    return prompt.trim();
  }
}

