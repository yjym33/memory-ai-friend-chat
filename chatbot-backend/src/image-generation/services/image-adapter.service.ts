import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImageProviderFactory } from '../providers/image-provider.factory';
import { EncryptionService } from '../../common/services/encryption.service';
import { User } from '../../auth/entity/user.entity';
import { AiSettings } from '../../ai-settings/entity/ai-settings.entity';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageProvider,
} from '../types/image.types';

/**
 * 이미지 생성 Adapter Service
 * 사용자 설정을 기반으로 적절한 이미지 Provider를 선택하고 호출합니다.
 */
@Injectable()
export class ImageAdapterService {
  private readonly logger = new Logger(ImageAdapterService.name);

  constructor(
    private readonly providerFactory: ImageProviderFactory,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AiSettings)
    private readonly aiSettingsRepository: Repository<AiSettings>,
  ) {}

  /**
   * 사용자 ID를 기반으로 이미지를 생성합니다.
   * @param userId - 사용자 ID
   * @param prompt - 이미지 생성 프롬프트
   * @param options - 추가 옵션
   * @returns 생성된 이미지 정보
   */
  async generateImage(
    userId: string,
    prompt: string,
    options?: Partial<ImageGenerationRequest>,
  ): Promise<ImageGenerationResponse> {
    this.logger.log(`🎨 이미지 생성 요청 - 사용자: ${userId}`);

    // 사용자 설정 가져오기
    const aiSettings = await this.aiSettingsRepository.findOne({
      where: { userId },
    });

    // 이미지 Provider 결정 (설정값 또는 기본값)
    const imageProviderStr = aiSettings?.imageProvider || 'dalle';
    const imageProvider = this.parseImageProvider(imageProviderStr);
    const imageModel = aiSettings?.imageModel || this.getDefaultModel(imageProvider);

    // Provider 선택
    const provider = this.providerFactory.getProvider(imageProvider);

    // API 키 결정
    const apiKey = await this.resolveApiKey(imageProvider, userId);

    // 요청 구성
    const request: ImageGenerationRequest = {
      prompt,
      model: options?.model || imageModel,
      size: options?.size || (aiSettings?.imageConfig?.defaultSize as any) || '1024x1024',
      quality: options?.quality || (aiSettings?.imageConfig?.defaultQuality as any) || 'standard',
      style: options?.style || (aiSettings?.imageConfig?.defaultStyle as any) || 'vivid',
      n: options?.n || 1,
      negativePrompt: options?.negativePrompt,
    };

    // 모델 검증
    if (!provider.validateModel(request.model!)) {
      const availableModels = provider.getAvailableModels();
      const errorMsg =
        `모델 '${request.model}'은 Provider '${imageProvider}'에서 지원하지 않습니다. ` +
        `사용 가능한 모델: ${availableModels.join(', ')}`;
      this.logger.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    this.logger.log(
      `🎨 이미지 생성 시작 - Provider: ${imageProvider}, Model: ${request.model}`,
    );

    try {
      const result = await provider.generateImage(request, apiKey);
      this.logger.log(
        `✅ 이미지 생성 완료 - ${result.images.length}개 생성됨`,
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ 이미지 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 문자열을 ImageProvider enum으로 변환합니다.
   */
  private parseImageProvider(providerStr: string): ImageProvider {
    const normalized = providerStr.toLowerCase();
    if (normalized === 'dalle' || normalized === 'dall-e') {
      return ImageProvider.DALLE;
    }
    if (normalized === 'stability' || normalized === 'stable-diffusion') {
      return ImageProvider.STABILITY;
    }
    if (
      normalized === 'google-imagen' ||
      normalized === 'imagen' ||
      normalized === 'nanobanana' ||
      normalized === 'gemini'
    ) {
      return ImageProvider.GOOGLE_IMAGEN;
    }
    // 기본값
    return ImageProvider.DALLE;
  }

  /**
   * Provider에 따른 기본 모델을 반환합니다.
   */
  private getDefaultModel(provider: ImageProvider): string {
    const providerInstance = this.providerFactory.getProvider(provider);
    return providerInstance.getDefaultModel();
  }

  /**
   * API 키를 결정합니다. (사용자 키 우선, 없으면 시스템 기본값)
   * @param provider - Provider 타입
   * @param userId - 사용자 ID
   * @returns API 키 (복호화된)
   */
  private async resolveApiKey(
    provider: ImageProvider,
    userId: string,
  ): Promise<string | undefined> {
    try {
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
      if (user.llmApiKeys) {
        let encryptedKey: string | undefined;

        switch (provider) {
          case ImageProvider.DALLE:
            // DALL-E는 OpenAI 키 사용
            encryptedKey = user.llmApiKeys.openai;
            break;
          case ImageProvider.STABILITY:
            // Stability AI는 별도 키 사용 (또는 llmApiKeys에 추가 필요)
            encryptedKey = (user.llmApiKeys as any).stability;
            break;
          case ImageProvider.GOOGLE_IMAGEN:
            // Google Imagen은 Google API 키 사용
            encryptedKey = user.llmApiKeys.google;
            break;
        }

        if (encryptedKey) {
          try {
            const decryptedKey =
              this.encryptionService.decryptApiKey(encryptedKey);
            if (decryptedKey && decryptedKey.trim() !== '') {
              this.logger.log(
                `✅ 사용자 ${userId}의 ${provider} API 키 사용`,
              );
              return decryptedKey;
            }
          } catch (error) {
            this.logger.error(
              `❌ 사용자 ${userId}의 ${provider} API 키 복호화 실패`,
            );
          }
        }
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
  private getSystemApiKey(provider: ImageProvider): string | undefined {
    switch (provider) {
      case ImageProvider.DALLE:
        return this.configService.get<string>('OPENAI_API_KEY');
      case ImageProvider.STABILITY:
        return this.configService.get<string>('STABILITY_API_KEY');
      case ImageProvider.GOOGLE_IMAGEN:
        return this.configService.get<string>('GOOGLE_API_KEY');
      default:
        return undefined;
    }
  }

  /**
   * 사용 가능한 이미지 모델 목록을 가져옵니다.
   * @param provider - Provider 타입 (선택사항, 없으면 모든 Provider)
   * @returns 모델 목록
   */
  getAvailableModels(provider?: ImageProvider): string[] {
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

  /**
   * 사용 가능한 이미지 크기 목록을 가져옵니다.
   * @param provider - Provider 타입
   * @param model - 모델 이름 (선택사항)
   * @returns 크기 목록
   */
  getSupportedSizes(provider: ImageProvider, model?: string): string[] {
    const providerInstance = this.providerFactory.getProvider(provider);
    return providerInstance.getSupportedSizes(model);
  }

  /**
   * 사용 가능한 Provider 목록을 반환합니다.
   */
  getAvailableProviders(): { id: string; name: string }[] {
    return [
      { id: 'dalle', name: 'DALL-E (OpenAI)' },
      { id: 'stability', name: 'Stability AI' },
      { id: 'google-imagen', name: 'Google Imagen (Nano Banana)' },
    ];
  }
}

