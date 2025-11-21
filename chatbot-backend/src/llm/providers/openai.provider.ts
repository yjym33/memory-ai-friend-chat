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
    // 기본 API 키는 환경 변수에서 가져옴 (사용자별 키는 나중에 주입)
    const defaultApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openai = new OpenAI({
      apiKey: defaultApiKey,
    });
  }

  /**
   * 사용자별 API 키로 OpenAI 클라이언트를 생성합니다.
   */
  private createClient(apiKey?: string): OpenAI {
    const key = apiKey || this.configService.get<string>('OPENAI_API_KEY') || '';
    return new OpenAI({
      apiKey: key,
    });
  }

  getName(): string {
    return LLMProvider.OPENAI;
  }

  getDefaultModel(): string {
    return 'gpt-5.1';
  }

  getAvailableModels(): string[] {
    return [
      'gpt-4',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-5.1',
      'gpt-3.5-turbo',
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
      const client = this.createClient(apiKey);
      
      const response = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        ...(request.model.includes('gpt-5') && {
          reasoning_effort: request.reasoningEffort || 'none',
        }),
      });

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
      
      const stream = await client.chat.completions.create({
        model: request.model,
        messages: request.messages.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        presence_penalty: request.presencePenalty,
        stream: true,
        ...(request.model.includes('gpt-5') && {
          reasoning_effort: request.reasoningEffort || 'none',
        }),
      });

      for await (const chunk of stream) {
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
      const key = apiKey || this.configService.get<string>('OPENAI_API_KEY') || '';
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1000,
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

