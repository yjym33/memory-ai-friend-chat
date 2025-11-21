import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './openai.provider';
import { GoogleProvider } from './google.provider';
import { AnthropicProvider } from './anthropic.provider';
import { ILLMProvider } from '../interfaces/llm-provider.interface';
import { LLMProvider } from '../types/llm.types';

/**
 * LLM Provider Factory
 * Provider 타입에 따라 적절한 Provider 인스턴스를 반환합니다.
 */
@Injectable()
export class LLMProviderFactory {
  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly googleProvider: GoogleProvider,
    private readonly anthropicProvider: AnthropicProvider,
  ) {}

  /**
   * Provider 타입에 따라 적절한 Provider 인스턴스를 반환합니다.
   * @param provider - Provider 타입
   * @returns Provider 인스턴스
   */
  getProvider(provider: LLMProvider): ILLMProvider {
    switch (provider) {
      case LLMProvider.OPENAI:
        return this.openaiProvider;
      case LLMProvider.GOOGLE:
        return this.googleProvider;
      case LLMProvider.ANTHROPIC:
        return this.anthropicProvider;
      default:
        throw new Error(`지원하지 않는 LLM Provider: ${provider}`);
    }
  }

  /**
   * 모든 Provider 목록을 반환합니다.
   * @returns Provider 목록
   */
  getAllProviders(): ILLMProvider[] {
    return [
      this.openaiProvider,
      this.googleProvider,
      this.anthropicProvider,
    ];
  }
}

