import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProvider,
} from '../types/llm.types';

/**
 * Anthropic Claude Provider 구현
 * Anthropic Claude API를 사용하여 LLM 응답을 생성합니다.
 */
@Injectable()
export class AnthropicProvider implements ILLMProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    // 기본 API 키는 환경 변수에서 가져옴
    const defaultApiKey =
      this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    this.anthropic = new Anthropic({
      apiKey: defaultApiKey,
    });
  }

  /**
   * 사용자별 API 키로 Anthropic 클라이언트를 생성합니다.
   */
  private createAnthropic(apiKey?: string): Anthropic {
    // 사용자별 API 키가 있으면 우선 사용
    const key = apiKey || this.configService.get<string>('ANTHROPIC_API_KEY') || '';
    
    this.logger.log(
      `🔑 Anthropic API 키 확인 - 사용자 키: ${apiKey ? `있음 (${apiKey.substring(0, Math.min(10, apiKey.length))}...)` : '없음'}, 시스템 키: ${this.configService.get<string>('ANTHROPIC_API_KEY') ? '있음' : '없음'}, 최종 키: ${key ? `있음 (${key.substring(0, Math.min(10, key.length))}...)` : '없음'}`,
    );
    
    // API 키 유효성 검증
    if (!key || key.trim() === '') {
      this.logger.error('❌ Anthropic API 키가 설정되지 않았습니다.');
      this.logger.error(`   - 사용자 API 키: ${apiKey ? '전달됨' : '미전달'}`);
      this.logger.error(`   - 환경 변수 ANTHROPIC_API_KEY: ${this.configService.get<string>('ANTHROPIC_API_KEY') ? '설정됨' : '미설정'}`);
      throw new Error('Anthropic API 키가 필요합니다. 설정에서 API 키를 입력해주세요.');
    }
    
    // API 키 형식 검증 (sk-ant-로 시작해야 함)
    if (!key.startsWith('sk-ant-') && !key.startsWith('sk-ant-api')) {
      this.logger.warn(
        `⚠️ Anthropic API 키 형식이 올바르지 않을 수 있습니다. (시작: ${key.substring(0, Math.min(20, key.length))}...)`,
      );
    } else {
      this.logger.log(`✅ Anthropic API 키 형식 확인 완료`);
    }
    
    return new Anthropic({
      apiKey: key,
    });
  }

  getName(): string {
    return LLMProvider.ANTHROPIC;
  }

  getDefaultModel(): string {
    return 'claude-3-5-sonnet-20241022';
  }

  getAvailableModels(): string[] {
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-5-sonnet-20241022',
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
      const anthropic = this.createAnthropic(apiKey);

      // Claude 메시지 형식으로 변환
      const messages = this.convertToClaudeMessages(request.messages);
      const systemMessage = this.extractSystemMessage(request.messages);

      const response = await anthropic.messages.create({
        model: request.model,
        max_tokens: request.maxTokens ?? 1000,
        temperature: request.temperature ?? 0.7,
        top_p: request.topP,
        ...(systemMessage && { system: systemMessage }),
        messages: messages as any,
      });

      const content = response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as any).text)
        .join('');

      return {
        content,
        model: response.model,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finishReason: response.stop_reason || undefined,
      };
    } catch (error) {
      this.logger.error('Anthropic Claude API 호출 실패:', error);
      throw new Error(`Anthropic Claude API 호출 실패: ${error.message}`);
    }
  }

  /**
   * Anthropic Claude 스트리밍 응답 생성
   * 
   * Anthropic SDK의 스트리밍 이벤트를 처리하여 실시간으로 응답을 생성합니다.
   * 
   * 스트리밍 이벤트 타입:
   * - content_block_start: 콘텐츠 블록 시작
   * - content_block_delta: 콘텐츠 블록 델타 (텍스트 청크)
   * - content_block_stop: 콘텐츠 블록 완료
   * - message_delta: 메시지 델타 (usage 정보 포함)
   * - message_stop: 메시지 완료
   */
  async generateStreamingResponse(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    apiKey?: string,
  ): Promise<void> {
    try {
      this.logger.log('🔄 Anthropic Claude 스트리밍 응답 시작');
      
      const anthropic = this.createAnthropic(apiKey);

      // Claude 메시지 형식으로 변환
      const messages = this.convertToClaudeMessages(request.messages);
      const systemMessage = this.extractSystemMessage(request.messages);

      this.logger.debug(
        `스트리밍 요청 정보 - 모델: ${request.model}, ` +
        `메시지 수: ${messages.length}, ` +
        `시스템 메시지: ${systemMessage ? '있음' : '없음'}`
      );

      // Anthropic API 스트리밍 요청 생성
      const streamConfig: any = {
        model: request.model,
        max_tokens: request.maxTokens ?? 1000,
        temperature: request.temperature ?? 0.7,
        messages: messages as any,
      };

      // top_p가 있으면 추가
      if (request.topP !== undefined) {
        streamConfig.top_p = request.topP;
      }

      // top_k가 있으면 추가 (Claude 지원)
      if (request.topK !== undefined && request.topK > 0) {
        streamConfig.top_k = request.topK;
      }

      // 시스템 메시지가 있으면 추가
      if (systemMessage) {
        streamConfig.system = systemMessage;
      }

      this.logger.debug(`스트리밍 요청 설정: ${JSON.stringify(streamConfig, null, 2)}`);

      const stream = await anthropic.messages.stream(streamConfig);

      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let isDone = false;
      let hasReceivedContent = false;
      let eventCount = 0;

      // 스트리밍 이벤트 처리
      for await (const event of stream) {
        eventCount++;
        
        // 디버깅: 첫 번째 이벤트와 주요 이벤트 로깅
        if (eventCount === 1 || event.type === 'message_stop') {
          this.logger.debug(`스트리밍 이벤트 #${eventCount}: ${event.type}`);
        }

        // content_block_delta: 텍스트 델타 처리 (실제 응답 내용)
        if (event.type === 'content_block_delta') {
          const deltaEvent = event as any;
          const delta = deltaEvent.delta;
          
          // delta가 객체이고 text 속성을 가진 경우
          if (delta && typeof delta === 'object' && 'text' in delta) {
            const text = delta.text;
            if (text && typeof text === 'string' && text.length > 0) {
              hasReceivedContent = true;
              onChunk({
                content: text,
                done: false,
              });
            }
          }
        }
        // message_delta: 메시지 델타 (usage 정보 포함 가능)
        else if (event.type === 'message_delta') {
          const deltaEvent = event as any;
          
          // usage 정보 추출
          if (deltaEvent?.usage) {
            const usage = deltaEvent.usage;
            if (usage.input_tokens) totalInputTokens = usage.input_tokens;
            if (usage.output_tokens) totalOutputTokens = usage.output_tokens;
          }
          
          // delta에 text가 있는 경우도 처리
          if (deltaEvent?.delta?.text) {
            const text = deltaEvent.delta.text;
            if (text && typeof text === 'string' && text.length > 0) {
              hasReceivedContent = true;
              onChunk({
                content: text,
                done: false,
              });
            }
          }
        }
        // message_stop: 메시지 완료 및 최종 usage 정보
        else if (event.type === 'message_stop') {
          const stopEvent = event as any;
          
          // 최종 usage 정보 확인
          if (stopEvent?.message?.usage) {
            const usage = stopEvent.message.usage;
            totalInputTokens = usage.input_tokens || totalInputTokens;
            totalOutputTokens = usage.output_tokens || totalOutputTokens;
          } else if (stopEvent?.usage) {
            const usage = stopEvent.usage;
            totalInputTokens = usage.input_tokens || totalInputTokens;
            totalOutputTokens = usage.output_tokens || totalOutputTokens;
          }

          isDone = true;
          this.logger.log(
            `스트리밍 완료 - ` +
            `총 이벤트: ${eventCount}, ` +
            `입력 토큰: ${totalInputTokens}, ` +
            `출력 토큰: ${totalOutputTokens}, ` +
            `콘텐츠 수신: ${hasReceivedContent ? '예' : '아니오'}`
          );

          // 완료 신호 전송
          onChunk({
            content: '',
            done: true,
            usage: totalInputTokens || totalOutputTokens ? {
              promptTokens: totalInputTokens,
              completionTokens: totalOutputTokens,
              totalTokens: totalInputTokens + totalOutputTokens,
            } : undefined,
          });
        }
        // content_block_start, content_block_stop: 로깅만 (디버깅용)
        else if (event.type === 'content_block_start' || event.type === 'content_block_stop') {
          // 내용 없이 로깅만
        }
      }

      // 스트림이 완료되었지만 done 신호가 전송되지 않은 경우
      if (!isDone) {
        this.logger.warn(
          `스트림 완료되었지만 done 신호 미수신 - ` +
          `총 이벤트: ${eventCount}, ` +
          `콘텐츠 수신: ${hasReceivedContent ? '예' : '아니오'}`
        );
        
        // 수동으로 완료 신호 전송
        onChunk({
          content: '',
          done: true,
          usage: totalInputTokens || totalOutputTokens ? {
            promptTokens: totalInputTokens,
            completionTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
          } : undefined,
        });
      }

      // 콘텐츠를 전혀 받지 못한 경우 경고
      if (!hasReceivedContent) {
        this.logger.warn('⚠️ Anthropic 스트리밍에서 콘텐츠를 전혀 받지 못했습니다.');
        this.logger.warn(`총 처리된 이벤트 수: ${eventCount}`);
      }

      this.logger.log('✅ Anthropic Claude 스트리밍 응답 완료');
    } catch (error) {
      this.logger.error('❌ Anthropic Claude 스트리밍 API 호출 실패:', error);
      
      // 에러 상세 정보 로깅
      if (error.response) {
        this.logger.error(`HTTP 응답: ${error.response.status} ${error.response.statusText}`);
        this.logger.error(`응답 본문: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.message) {
        this.logger.error(`에러 메시지: ${error.message}`);
      }
      
      // 에러를 다시 던져서 상위에서 처리할 수 있도록 함
      throw new Error(
        `Anthropic Claude 스트리밍 API 호출 실패: ${error.message || '알 수 없는 오류'}`,
      );
    }
  }

  /**
   * OpenAI 형식의 메시지를 Claude 형식으로 변환합니다.
   */
  private convertToClaudeMessages(
    messages: Array<{ role: string; content: string }>,
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      [];

    for (const msg of messages) {
      // system 메시지는 별도로 처리
      if (msg.role === 'system') {
        continue;
      }

      if (msg.role === 'user' || msg.role === 'assistant') {
        claudeMessages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    return claudeMessages;
  }

  /**
   * 시스템 메시지를 추출합니다.
   */
  private extractSystemMessage(
    messages: Array<{ role: string; content: string }>,
  ): string | undefined {
    const systemMessage = messages.find((msg) => msg.role === 'system');
    return systemMessage?.content;
  }
}

