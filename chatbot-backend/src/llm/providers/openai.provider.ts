import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';
import OpenAI from 'openai';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProvider,
} from '../types/llm.types';

/**
 * OpenAI Provider 구현
 * OpenAI API를 사용하여 LLM 응답을 생성합니다.
 */
@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.logger.debug(
      '[OpenAIProvider] Constructor 실행 - OpenAI Provider 초기화',
    );
    // 기본 API 키는 환경 변수에서 가져옴 (사용자별 키는 나중에 주입)
    const defaultApiKey =
      this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openai = new OpenAI({
      apiKey: defaultApiKey,
    });
    this.logger.debug('[OpenAIProvider] OpenAI 클라이언트 생성 완료');
  }

  /**
   * 사용자별 API 키로 OpenAI 클라이언트를 생성합니다.
   */
  private createClient(apiKey?: string): OpenAI {
    const key =
      apiKey || this.configService.get<string>('OPENAI_API_KEY') || '';
    return new OpenAI({
      apiKey: key,
    });
  }

  getName(): string {
    return LLMProvider.OPENAI;
  }

  getDefaultModel(): string {
    return 'gpt-5.2';
  }

  getAvailableModels(): string[] {
    return [
      'gpt-5.3-codex',
      'gpt-5.2',
      'gpt-5.2-instant',
      'gpt-4o',
      'gpt-4o-mini',
      'o1',
      'o3-mini',
    ];
  }

  validateModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  /**
   * 모델이 max_completion_tokens를 사용해야 하는지 확인합니다.
   * 최신 모델(gpt-4o, gpt-4-turbo, o1, gpt-5 등)은 max_completion_tokens를 사용합니다.
   */
  private usesMaxCompletionTokens(model: string): boolean {
    const modernModels = ['gpt-5', 'gpt-4o', 'gpt-4-turbo', 'o1', 'o3'];
    return modernModels.some((m) => model.toLowerCase().includes(m));
  }

  async generateResponse(
    request: LLMRequest,
    apiKey?: string,
  ): Promise<LLMResponse> {
    try {
      const client = this.createClient(apiKey);
      const useNewTokenParam = this.usesMaxCompletionTokens(request.model);

      const response = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        // 최신 모델은 max_completion_tokens 사용, 이전 모델은 max_tokens 사용
        ...(useNewTokenParam
          ? { max_completion_tokens: request.maxTokens ?? 1000 }
          : { max_tokens: request.maxTokens ?? 1000 }),
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        ...(request.model.includes('gpt-5') && {
          reasoning_effort: request.reasoningEffort || 'none',
        }),
      } as any);

      return {
        content: response.choices[0]?.message?.content || '',
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens,
        },
        finishReason: response.choices[0]?.finish_reason || undefined,
      };
    } catch (error) {
      this.logger.error('OpenAI API 호출 실패:', error);
      throw new Error(`OpenAI API 호출 실패: ${error.message}`);
    }
  }

  async generateStreamingResponse(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    apiKey?: string,
  ): Promise<void> {
    try {
      const client = this.createClient(apiKey);
      const useNewTokenParam = this.usesMaxCompletionTokens(request.model);

      // 토큰 파라미터 설정
      const tokenParam = useNewTokenParam
        ? { max_completion_tokens: request.maxTokens ?? 1000 }
        : { max_tokens: request.maxTokens ?? 1000 };

      // 스트리밍 요청 생성
      const stream = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        ...tokenParam,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: true as const,
        ...(request.model.includes('gpt-5') && {
          reasoning_effort: request.reasoningEffort || 'none',
        }),
      } as Parameters<typeof client.chat.completions.create>[0]);

      for await (const chunk of stream as AsyncIterable<any>) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          onChunk({
            content,
            done: false,
          });
        }

        // 스트림 완료 시
        if (chunk.choices[0]?.finish_reason) {
          onChunk({
            content: '',
            done: true,
            usage: chunk.usage
              ? {
                  promptTokens: chunk.usage.prompt_tokens,
                  completionTokens: chunk.usage.completion_tokens,
                  totalTokens: chunk.usage.total_tokens,
                }
              : undefined,
          });
        }
      }
    } catch (error) {
      this.logger.error('OpenAI 스트리밍 API 호출 실패:', error);
      throw new Error(`OpenAI 스트리밍 API 호출 실패: ${error.message}`);
    }
  }

  /**
   * 기존 axios 기반 스트리밍 구현 (호환성 유지)
   */
  async generateStreamingResponseAxios(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    apiKey?: string,
  ): Promise<void> {
    try {
      const key =
        apiKey || this.configService.get<string>('OPENAI_API_KEY') || '';
      const useNewTokenParam = this.usesMaxCompletionTokens(request.model);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          // 최신 모델은 max_completion_tokens 사용, 이전 모델은 max_tokens 사용
          ...(useNewTokenParam
            ? { max_completion_tokens: request.maxTokens ?? 1000 }
            : { max_tokens: request.maxTokens ?? 1000 }),
          top_p: request.topP,
          frequency_penalty: request.frequencyPenalty,
          presence_penalty: request.presencePenalty,
          stream: true,
          ...(request.model.includes('gpt-5') && {
            reasoning_effort: request.reasoningEffort || 'none',
          }),
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      return new Promise((resolve, reject) => {
        let buffer = '';

        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.trim() === '') continue;

            if (line.includes('[DONE]')) {
              onChunk({
                content: '',
                done: true,
              });
              resolve();
              return;
            }

            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices[0]?.delta?.content;
                if (content) {
                  onChunk({
                    content,
                    done: false,
                  });
                }

                if (data.choices[0]?.finish_reason) {
                  onChunk({
                    content: '',
                    done: true,
                    usage: data.usage
                      ? {
                          promptTokens: data.usage.prompt_tokens,
                          completionTokens: data.usage.completion_tokens,
                          totalTokens: data.usage.total_tokens,
                        }
                      : undefined,
                  });
                  resolve();
                  return;
                }
              } catch (e) {
                // JSON 파싱 오류 무시
              }
            }
          }
        });

        response.data.on('end', () => {
          onChunk({
            content: '',
            done: true,
          });
          resolve();
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error('OpenAI 스트리밍 API 호출 실패:', error);
      throw new Error(`OpenAI 스트리밍 API 호출 실패: ${error.message}`);
    }
  }
}
