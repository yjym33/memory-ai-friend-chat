import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LLMProviderFactory } from '../providers/llm-provider.factory';
import { EncryptionService } from '../../common/services/encryption.service';
import { User } from '../../auth/entity/user.entity';
import { AiSettings } from '../../ai-settings/entity/ai-settings.entity';
import {
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  LLMProvider,
} from '../types/llm.types';

/**
 * LLM Adapter Service
 * 사용자 설정을 기반으로 적절한 LLM Provider를 선택하고 호출합니다.
 */
@Injectable()
export class LLMAdapterService {
  private readonly logger = new Logger(LLMAdapterService.name);

  constructor(
    private readonly providerFactory: LLMProviderFactory,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AiSettings)
    private readonly aiSettingsRepository: Repository<AiSettings>,
  ) {}

  /**
   * 사용자 ID를 기반으로 LLM 응답을 생성합니다.
   * @param userId - 사용자 ID
   * @param messages - 대화 메시지 배열
   * @param options - 추가 옵션
   * @returns LLM 응답
   */
  async generateResponse(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    options?: Partial<LLMRequest>,
  ): Promise<LLMResponse> {
    // 사용자 설정 가져오기
    const aiSettings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    if (!aiSettings) {
      throw new NotFoundException('AI 설정을 찾을 수 없습니다.');
    }

    // Provider 선택
    const provider = this.providerFactory.getProvider(aiSettings.llmProvider);

    // API 키 결정 (사용자 키 우선, 없으면 시스템 기본값)
    const apiKey = await this.resolveApiKey(
      aiSettings.llmProvider,
      userId,
      aiSettings.llmModel,
    );

    // 요청 구성
    const request: LLMRequest = {
      model: aiSettings.llmModel,
      messages,
      temperature: aiSettings.llmConfig?.temperature ?? 0.7,
      maxTokens: aiSettings.llmConfig?.maxTokens ?? 1000,
      topP: aiSettings.llmConfig?.topP,
      topK: aiSettings.llmConfig?.topK,
      frequencyPenalty: aiSettings.llmConfig?.frequencyPenalty,
      presencePenalty: aiSettings.llmConfig?.presencePenalty,
      reasoningEffort: aiSettings.llmConfig?.reasoningEffort,
      ...options,
    };

    // 모델 검증
    if (!provider.validateModel(request.model)) {
      const availableModels = provider.getAvailableModels();
      const errorMsg =
        `모델 '${request.model}'은 Provider '${aiSettings.llmProvider}'에서 지원하지 않습니다. ` +
        `사용 가능한 모델: ${availableModels.join(', ')}. ` +
        `AI 설정에서 올바른 모델을 선택해주세요.`;
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Provider 호출
    return provider.generateResponse(request, apiKey);
  }

  /**
   * 사용자 ID를 기반으로 LLM 스트리밍 응답을 생성합니다.
   * @param userId - 사용자 ID
   * @param messages - 대화 메시지 배열
   * @param onChunk - 각 청크를 받을 때 호출되는 콜백 함수
   * @param options - 추가 옵션
   */
  async generateStreamingResponse(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    onChunk: (chunk: LLMStreamChunk) => void,
    options?: Partial<LLMRequest>,
  ): Promise<void> {
    // 사용자 설정 가져오기
    const aiSettings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    if (!aiSettings) {
      throw new NotFoundException('AI 설정을 찾을 수 없습니다.');
    }

    // Provider 선택
    const provider = this.providerFactory.getProvider(aiSettings.llmProvider);

    // API 키 결정 (사용자 키 우선, 없으면 시스템 기본값)
    const apiKey = await this.resolveApiKey(
      aiSettings.llmProvider,
      userId,
      aiSettings.llmModel,
    );

    // 요청 구성
    const request: LLMRequest = {
      model: aiSettings.llmModel,
      messages,
      temperature: aiSettings.llmConfig?.temperature ?? 0.7,
      maxTokens: aiSettings.llmConfig?.maxTokens ?? 1000,
      topP: aiSettings.llmConfig?.topP,
      topK: aiSettings.llmConfig?.topK,
      frequencyPenalty: aiSettings.llmConfig?.frequencyPenalty,
      presencePenalty: aiSettings.llmConfig?.presencePenalty,
      reasoningEffort: aiSettings.llmConfig?.reasoningEffort,
      stream: true,
      ...options,
    };

    // 모델 검증
    if (!provider.validateModel(request.model)) {
      const availableModels = provider.getAvailableModels();
      const errorMsg =
        `모델 '${request.model}'은 Provider '${aiSettings.llmProvider}'에서 지원하지 않습니다. ` +
        `사용 가능한 모델: ${availableModels.join(', ')}. ` +
        `AI 설정에서 올바른 모델을 선택해주세요.`;
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    // Provider 호출
    return provider.generateStreamingResponse(request, onChunk, apiKey);
  }

  /**
   * API 키를 결정합니다. (사용자 키 우선, 없으면 시스템 기본값)
   * @param provider - Provider 타입
   * @param userId - 사용자 ID
   * @param model - 모델 이름 (선택사항)
   * @returns API 키 (복호화된)
   */
  private async resolveApiKey(
    provider: LLMProvider,
    userId: string,
    model?: string,
  ): Promise<string | undefined> {
    try {
      // 사용자 정보 가져오기
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(
          `사용자 ${userId}를 찾을 수 없습니다. 시스템 기본 키를 사용합니다.`,
        );
        return this.getSystemApiKey(provider);
      }

      // 사용자별 API 키 확인
      this.logger.debug(
        `🔍 사용자 ${userId}의 API 키 조회 중... Provider: ${provider}`,
      );

      if (user.llmApiKeys) {
        this.logger.debug(
          `📦 사용자 API 키 객체 존재: ${JSON.stringify(Object.keys(user.llmApiKeys))}`,
        );

        let encryptedKey: string | undefined;

        switch (provider) {
          case LLMProvider.OPENAI:
            encryptedKey = user.llmApiKeys.openai;
            break;
          case LLMProvider.GOOGLE:
            encryptedKey = user.llmApiKeys.google;
            break;
          case LLMProvider.ANTHROPIC:
            encryptedKey = user.llmApiKeys.anthropic;
            break;
        }

        this.logger.debug(
          `🔑 ${provider} Provider의 암호화된 키 존재 여부: ${encryptedKey ? '있음' : '없음'}`,
        );

        if (encryptedKey) {
          this.logger.log(
            `🔍 사용자 ${userId}의 ${provider} 암호화된 API 키 발견 (길이: ${encryptedKey.length})`,
          );
          try {
            const decryptedKey =
              this.encryptionService.decryptApiKey(encryptedKey);
            if (decryptedKey && decryptedKey.trim() !== '') {
              this.logger.log(
                `✅ 사용자 ${userId}의 ${provider} API 키 복호화 성공 (키 시작: ${decryptedKey.substring(0, Math.min(10, decryptedKey.length))}...)`,
              );
              return decryptedKey;
            } else {
              this.logger.warn(
                `⚠️ 사용자 ${userId}의 ${provider} API 키 복호화 결과가 비어있습니다.`,
              );
            }
          } catch (error) {
            this.logger.error(
              `❌ 사용자 ${userId}의 ${provider} API 키 복호화 실패: ${error.message}`,
            );
            this.logger.error(`복호화 오류 상세:`, error);
          }
        } else {
          this.logger.warn(
            `⚠️ 사용자 ${userId}의 ${provider} API 키가 저장되어 있지 않습니다.`,
          );
        }
      } else {
        this.logger.debug(`사용자 ${userId}의 llmApiKeys가 없습니다.`);
      }

      // 사용자 키가 없으면 시스템 기본 키 사용
      return this.getSystemApiKey(provider);
    } catch (error) {
      this.logger.error(`API 키 결정 실패: ${error.message}`);
      return this.getSystemApiKey(provider);
    }
  }

  /**
   * 시스템 기본 API 키를 가져옵니다.
   * @param provider - Provider 타입
   * @returns API 키
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
   * 사용 가능한 모델 목록을 가져옵니다.
   * @param provider - Provider 타입 (선택사항, 없으면 모든 Provider)
   * @returns 모델 목록
   */
  getAvailableModels(provider?: LLMProvider): string[] {
    if (provider) {
      const providerInstance = this.providerFactory.getProvider(provider);
      return providerInstance.getAvailableModels();
    }

    // 모든 Provider의 모델 반환
    const allModels: string[] = [];
    this.providerFactory.getAllProviders().forEach((p) => {
      allModels.push(...p.getAvailableModels());
    });
    return allModels;
  }
}
