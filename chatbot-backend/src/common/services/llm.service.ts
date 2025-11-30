import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LLM_CONFIG, ERROR_MESSAGES } from '../constants/llm.constants';

/**
 * LLM API 통신 서비스
 * OpenAI API와의 상호작용을 담당합니다.
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  /**
   * LLM 스트리밍 응답 생성
   * @param messages - 대화 메시지 배열
   * @param onChunk - 각 토큰을 받을 때 호출되는 콜백
   */
  async generateStreamingResponse(
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: LLM_CONFIG.MODEL,
          messages,
          max_tokens: LLM_CONFIG.MAX_TOKENS,
          temperature: LLM_CONFIG.TEMPERATURE,
          top_p: LLM_CONFIG.TOP_P,
          frequency_penalty: LLM_CONFIG.FREQUENCY_PENALTY,
          presence_penalty: LLM_CONFIG.PRESENCE_PENALTY,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      await this.processStream(response.data, onChunk);
    } catch (error) {
      this.logger.error('LLM 스트리밍 API 호출 실패:', error);
      throw new Error(ERROR_MESSAGES.LLM_API_FAILED);
    }
  }

  /**
   * 스트림 데이터 처리 (UTF-8 인코딩 문제 해결)
   */
  private async processStream(
    stream: NodeJS.ReadableStream,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let buffer = '';

      stream.on('data', (chunk: Buffer) => {
        // UTF-8 디코딩을 위해 버퍼에 누적
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');

        // 마지막 줄은 불완전할 수 있으므로 보관
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          if (line.includes('[DONE]')) {
            resolve();
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(6));
              const content = jsonData.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // JSON 파싱 오류 무시
            }
          }
        }
      });

      stream.on('end', () => resolve());
      stream.on('error', (error: Error) => reject(error));
    });
  }

  /**
   * 일반 LLM 응답 생성 (비스트리밍)
   * @param messages - 대화 메시지 배열
   * @returns AI 응답 텍스트
   */
  async generateResponse(
    messages: Array<{ role: string; content: string }>,
  ): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: LLM_CONFIG.MODEL,
          messages,
          max_tokens: LLM_CONFIG.MAX_TOKENS,
          temperature: LLM_CONFIG.TEMPERATURE,
          top_p: LLM_CONFIG.TOP_P,
          frequency_penalty: LLM_CONFIG.FREQUENCY_PENALTY,
          presence_penalty: LLM_CONFIG.PRESENCE_PENALTY,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0]?.message?.content || '';
    } catch (error) {
      this.logger.error('LLM API 호출 실패:', error);
      throw new Error(ERROR_MESSAGES.LLM_API_FAILED);
    }
  }

  /**
   * 메시지 히스토리 구성
   * @param systemPrompt - 시스템 프롬프트
   * @param conversationMessages - 대화 메시지
   * @param currentMessage - 현재 사용자 메시지
   * @param maxContextMessages - 최대 컨텍스트 메시지 수
   */
  buildMessageHistory(
    systemPrompt: string,
    conversationMessages: Array<{ role: string; content: string }>,
    currentMessage: string,
    maxContextMessages: number = LLM_CONFIG.MAX_CONTEXT_MESSAGES,
  ): Array<{ role: string; content: string }> {
    const messages = [{ role: 'system', content: systemPrompt }];

    // 최근 N개 메시지만 추가
    if (conversationMessages && conversationMessages.length > 0) {
      const recentMessages = conversationMessages.slice(-maxContextMessages);
      for (const msg of recentMessages) {
        if (msg.content && msg.content.trim()) {
          messages.push({
            role: msg.role,
            content: msg.content.trim(),
          });
        }
      }
    }

    // 현재 메시지 추가
    messages.push({
      role: 'user',
      content: currentMessage.trim(),
    });

    return messages;
  }
}

