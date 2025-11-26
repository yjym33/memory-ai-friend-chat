import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMProviderFactory } from '../providers/llm-provider.factory';
import {
  LLMRequest,
  LLMProvider,
  LLMStreamChunk,
} from '../types/llm.types';

/**
 * Multi-Model 요청 인터페이스
 */
export interface MultiModelRequest {
  providers: LLMProvider[];
  messages: Array<{ role: string; content: string }>;
  options?: Partial<LLMRequest>;
}

/**
 * 개별 Provider 응답
 */
export interface ProviderResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  success: boolean;
  error?: string;
  latency: number;
}

/**
 * Multi-Model 응답 인터페이스
 */
export interface MultiModelResponse {
  responses: ProviderResponse[];
  totalLatency: number;
  successCount: number;
  failCount: number;
}

/**
 * LLM Orchestrator Service
 * 여러 LLM Provider를 동시에 호출하여 복수의 응답을 수집합니다.
 * 사용자는 여러 AI 모델의 답변을 비교하고 선택할 수 있습니다.
 */
@Injectable()
export class LLMOrchestratorService {
  private readonly logger = new Logger(LLMOrchestratorService.name);

  constructor(
    private readonly providerFactory: LLMProviderFactory,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 여러 LLM Provider를 동시에 호출하여 복수의 응답을 수집합니다.
   * @param request - Multi-Model 요청
   * @param userApiKeys - 사용자별 API 키 (선택사항)
   * @returns Multi-Model 응답
   */
  async generateMultiModelResponses(
    request: MultiModelRequest,
    userApiKeys?: Partial<Record<LLMProvider, string>>,
  ): Promise<MultiModelResponse> {
    const startTime = Date.now();

    this.logger.log(
      `🚀 Multi-Model 요청 시작: ${request.providers.join(', ')}`,
    );

    // 모든 Provider를 병렬로 호출
    const promises = request.providers.map((providerType) =>
      this.callProvider(providerType, request, userApiKeys?.[providerType]),
    );

    // 모든 응답 수집 (실패한 것도 포함)
    const results = await Promise.allSettled(promises);

    const responses: ProviderResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        provider: request.providers[index],
        model: 'unknown',
        content: '',
        success: false,
        error: result.reason?.message || 'Unknown error',
        latency: 0,
      };
    });

    const successCount = responses.filter((r) => r.success).length;
    const failCount = responses.filter((r) => !r.success).length;

    this.logger.log(
      `✅ Multi-Model 응답 완료: ${successCount}/${request.providers.length} 성공`,
    );

    return {
      responses,
      totalLatency: Date.now() - startTime,
      successCount,
      failCount,
    };
  }

  /**
   * 개별 Provider를 호출합니다.
   */
  private async callProvider(
    providerType: LLMProvider,
    request: MultiModelRequest,
    userApiKey?: string,
  ): Promise<ProviderResponse> {
    const providerStartTime = Date.now();

    try {
      const provider = this.providerFactory.getProvider(providerType);
      const apiKey = userApiKey || this.getSystemApiKey(providerType);

      if (!apiKey) {
        throw new Error(`${providerType} API 키가 설정되지 않았습니다.`);
      }

      const model = provider.getDefaultModel();

      const llmRequest: LLMRequest = {
        model,
        messages: request.messages,
        temperature: request.options?.temperature ?? 0.7,
        maxTokens: request.options?.maxTokens ?? 1000,
        ...request.options,
      };

      this.logger.debug(`📤 ${providerType} (${model}) 호출 중...`);

      const response = await provider.generateResponse(llmRequest, apiKey);

      this.logger.debug(
        `📥 ${providerType} 응답 완료 (${Date.now() - providerStartTime}ms)`,
      );

      return {
        provider: providerType,
        model,
        content: response.content,
        success: true,
        latency: Date.now() - providerStartTime,
      };
    } catch (error) {
      this.logger.error(`❌ ${providerType} 호출 실패: ${error.message}`);
      return {
        provider: providerType,
        model: 'unknown',
        content: '',
        success: false,
        error: error.message,
        latency: Date.now() - providerStartTime,
      };
    }
  }

  /**
   * 스트리밍 방식의 Multi-Model 호출
   * 각 Provider별로 개별 스트림을 전송합니다.
   */
  async generateMultiModelStreams(
    request: MultiModelRequest,
    onChunk: (provider: LLMProvider, chunk: string, model: string) => void,
    onComplete: (provider: LLMProvider, model: string) => void,
    onError: (provider: LLMProvider, error: string) => void,
    userApiKeys?: Partial<Record<LLMProvider, string>>,
  ): Promise<void> {
    this.logger.log(
      `🚀 Multi-Model 스트리밍 시작: ${request.providers.join(', ')}`,
    );

    const promises = request.providers.map(async (providerType) => {
      try {
        const provider = this.providerFactory.getProvider(providerType);
        const apiKey =
          userApiKeys?.[providerType] || this.getSystemApiKey(providerType);

        if (!apiKey) {
          throw new Error(`${providerType} API 키가 설정되지 않았습니다.`);
        }

        const model = provider.getDefaultModel();

        const llmRequest: LLMRequest = {
          model,
          messages: request.messages,
          stream: true,
          temperature: request.options?.temperature ?? 0.7,
          maxTokens: request.options?.maxTokens ?? 1000,
          ...request.options,
        };

        await provider.generateStreamingResponse(
          llmRequest,
          (chunk: LLMStreamChunk) => {
            if (chunk.content) {
              onChunk(providerType, chunk.content, model);
            }
          },
          apiKey,
        );

        onComplete(providerType, model);
      } catch (error) {
        this.logger.error(
          `❌ ${providerType} 스트리밍 실패: ${error.message}`,
        );
        onError(providerType, error.message);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log(`✅ Multi-Model 스트리밍 완료`);
  }

  /**
   * 합의 기반 응답 생성
   * 여러 모델의 답변을 종합하여 최선의 답변을 생성합니다.
   */
  async generateConsensusResponse(
    request: MultiModelRequest,
    userApiKeys?: Partial<Record<LLMProvider, string>>,
  ): Promise<{ consensus: string; sources: ProviderResponse[] }> {
    // 먼저 모든 모델에서 응답 수집
    const multiResponse = await this.generateMultiModelResponses(
      request,
      userApiKeys,
    );

    const successfulResponses = multiResponse.responses.filter((r) => r.success);

    if (successfulResponses.length === 0) {
      throw new Error('모든 Provider 호출에 실패했습니다.');
    }

    if (successfulResponses.length === 1) {
      return {
        consensus: successfulResponses[0].content,
        sources: successfulResponses,
      };
    }

    // GPT에게 종합 요청
    const consensusPrompt = `다음은 같은 질문에 대한 여러 AI 모델의 답변입니다. 
이 답변들의 공통점과 핵심 내용을 종합하여 가장 정확하고 완성도 높은 답변을 작성해주세요.
중복되는 내용은 한 번만 언급하고, 각 답변의 장점을 살려주세요.

${successfulResponses.map((r) => `[${r.provider.toUpperCase()} - ${r.model}]:\n${r.content}`).join('\n\n---\n\n')}

위 답변들을 종합한 최종 답변:`;

    const openaiProvider = this.providerFactory.getProvider(LLMProvider.OPENAI);
    const apiKey =
      userApiKeys?.[LLMProvider.OPENAI] ||
      this.getSystemApiKey(LLMProvider.OPENAI);

    const consensusResponse = await openaiProvider.generateResponse(
      {
        model: openaiProvider.getDefaultModel(),
        messages: [{ role: 'user', content: consensusPrompt }],
        temperature: 0.5,
        maxTokens: 1500,
      },
      apiKey,
    );

    return {
      consensus: consensusResponse.content,
      sources: successfulResponses,
    };
  }

  /**
   * 시스템 기본 API 키를 가져옵니다.
   */
  private getSystemApiKey(provider: LLMProvider): string | undefined {
    switch (provider) {
      case LLMProvider.OPENAI:
        return this.configService.get<string>('OPENAI_API_KEY');
      case LLMProvider.GOOGLE:
        return this.configService.get<string>('GOOGLE_API_KEY');
      case LLMProvider.ANTHROPIC:
        return this.configService.get<string>('ANTHROPIC_API_KEY');
      default:
        return undefined;
    }
  }

  /**
   * 사용 가능한 Provider 목록을 반환합니다.
   * API 키가 설정된 Provider만 반환합니다.
   */
  getAvailableProviders(): LLMProvider[] {
    const providers: LLMProvider[] = [];

    if (this.getSystemApiKey(LLMProvider.OPENAI)) {
      providers.push(LLMProvider.OPENAI);
    }
    if (this.getSystemApiKey(LLMProvider.GOOGLE)) {
      providers.push(LLMProvider.GOOGLE);
    }
    if (this.getSystemApiKey(LLMProvider.ANTHROPIC)) {
      providers.push(LLMProvider.ANTHROPIC);
    }

    return providers;
  }

  /**
   * Provider 정보를 반환합니다.
   */
  getProviderInfo(): Array<{
    provider: LLMProvider;
    name: string;
    defaultModel: string;
    available: boolean;
  }> {
    return [
      {
        provider: LLMProvider.OPENAI,
        name: 'OpenAI GPT',
        defaultModel: this.providerFactory
          .getProvider(LLMProvider.OPENAI)
          .getDefaultModel(),
        available: !!this.getSystemApiKey(LLMProvider.OPENAI),
      },
      {
        provider: LLMProvider.GOOGLE,
        name: 'Google Gemini',
        defaultModel: this.providerFactory
          .getProvider(LLMProvider.GOOGLE)
          .getDefaultModel(),
        available: !!this.getSystemApiKey(LLMProvider.GOOGLE),
      },
      {
        provider: LLMProvider.ANTHROPIC,
        name: 'Anthropic Claude',
        defaultModel: this.providerFactory
          .getProvider(LLMProvider.ANTHROPIC)
          .getDefaultModel(),
        available: !!this.getSystemApiKey(LLMProvider.ANTHROPIC),
      },
    ];
  }
}

