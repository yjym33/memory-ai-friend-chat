import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageProviderFactory } from '../providers/image-provider.factory';
import {
  ImageProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  GeneratedImage,
} from '../types/image.types';

/**
 * Multi-Image 요청 인터페이스
 */
export interface MultiImageRequest {
  providers: ImageProvider[];
  prompt: string;
  negativePrompt?: string;
  size?: string;
  quality?: string;
  style?: string;
}

/**
 * 개별 Provider 이미지 응답
 */
export interface ProviderImageResponse {
  provider: ImageProvider;
  model: string;
  success: boolean;
  images: GeneratedImage[];
  error?: string;
  latency: number;
}

/**
 * Multi-Image 응답 인터페이스
 */
export interface MultiImageResponse {
  responses: ProviderImageResponse[];
  totalLatency: number;
  successCount: number;
  failCount: number;
}

/**
 * Image Orchestrator Service
 * 여러 이미지 생성 Provider를 동시에 호출하여 복수의 이미지를 수집합니다.
 * 사용자는 여러 AI의 이미지를 비교하고 선택할 수 있습니다.
 */
@Injectable()
export class ImageOrchestratorService {
  private readonly logger = new Logger(ImageOrchestratorService.name);

  constructor(
    private readonly providerFactory: ImageProviderFactory,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 여러 이미지 생성 Provider를 동시에 호출하여 복수의 이미지를 수집합니다.
   * @param request - Multi-Image 요청
   * @param userApiKeys - 사용자별 API 키 (선택사항)
   * @returns Multi-Image 응답
   */
  async generateMultiImages(
    request: MultiImageRequest,
    userApiKeys?: Partial<Record<ImageProvider, string>>,
  ): Promise<MultiImageResponse> {
    const startTime = Date.now();

    this.logger.log(
      `🎨 Multi-Image 요청 시작: ${request.providers.join(', ')}`,
    );
    this.logger.log(`📝 프롬프트: ${request.prompt}`);

    // 모든 Provider를 병렬로 호출
    const promises = request.providers.map((providerType) =>
      this.callImageProvider(providerType, request, userApiKeys?.[providerType]),
    );

    // 모든 응답 수집 (실패한 것도 포함)
    const results = await Promise.allSettled(promises);

    const responses: ProviderImageResponse[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        provider: request.providers[index],
        model: 'unknown',
        success: false,
        images: [],
        error: result.reason?.message || 'Unknown error',
        latency: 0,
      };
    });

    const successCount = responses.filter((r) => r.success).length;
    const failCount = responses.filter((r) => !r.success).length;

    this.logger.log(
      `✅ Multi-Image 응답 완료: ${successCount}/${request.providers.length} 성공`,
    );

    return {
      responses,
      totalLatency: Date.now() - startTime,
      successCount,
      failCount,
    };
  }

  /**
   * 개별 이미지 Provider를 호출합니다.
   */
  private async callImageProvider(
    providerType: ImageProvider,
    request: MultiImageRequest,
    userApiKey?: string,
  ): Promise<ProviderImageResponse> {
    const providerStartTime = Date.now();

    try {
      const provider = this.providerFactory.getProvider(providerType);
      const apiKey = userApiKey || this.getSystemApiKey(providerType);

      if (!apiKey) {
        throw new Error(`${providerType} API 키가 설정되지 않았습니다.`);
      }

      const model = provider.getDefaultModel();

      const imageRequest: ImageGenerationRequest = {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        model,
        size: request.size as any,
        quality: request.quality as any,
        style: request.style as any,
        n: 1, // 각 Provider당 1개 이미지
      };

      this.logger.debug(`📤 ${providerType} (${model}) 이미지 생성 중...`);

      const response: ImageGenerationResponse = await provider.generateImage(
        imageRequest,
        apiKey,
      );

      this.logger.debug(
        `📥 ${providerType} 이미지 생성 완료 (${Date.now() - providerStartTime}ms)`,
      );

      return {
        provider: providerType,
        model: response.model,
        success: true,
        images: response.images,
        latency: Date.now() - providerStartTime,
      };
    } catch (error) {
      this.logger.error(`❌ ${providerType} 이미지 생성 실패: ${error.message}`);
      return {
        provider: providerType,
        model: 'unknown',
        success: false,
        images: [],
        error: error.message,
        latency: Date.now() - providerStartTime,
      };
    }
  }

  /**
   * 시스템 기본 API 키를 가져옵니다.
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
   * 사용 가능한 이미지 Provider 목록을 반환합니다.
   * API 키가 설정된 Provider만 반환합니다.
   */
  getAvailableProviders(): ImageProvider[] {
    const providers: ImageProvider[] = [];

    if (this.getSystemApiKey(ImageProvider.DALLE)) {
      providers.push(ImageProvider.DALLE);
    }
    if (this.getSystemApiKey(ImageProvider.STABILITY)) {
      providers.push(ImageProvider.STABILITY);
    }
    if (this.getSystemApiKey(ImageProvider.GOOGLE_IMAGEN)) {
      providers.push(ImageProvider.GOOGLE_IMAGEN);
    }

    return providers;
  }

  /**
   * Provider 정보를 반환합니다.
   */
  getProviderInfo(): Array<{
    provider: ImageProvider;
    name: string;
    defaultModel: string;
    available: boolean;
  }> {
    const allProviders = this.providerFactory.getAllProviders();

    return allProviders.map((provider) => {
      const providerType = provider.getProviderType();
      return {
        provider: providerType,
        name: this.getProviderDisplayName(providerType),
        defaultModel: provider.getDefaultModel(),
        available: !!this.getSystemApiKey(providerType),
      };
    });
  }

  /**
   * Provider 표시 이름을 반환합니다.
   */
  private getProviderDisplayName(provider: ImageProvider): string {
    switch (provider) {
      case ImageProvider.DALLE:
        return 'DALL-E (OpenAI)';
      case ImageProvider.STABILITY:
        return 'Stable Diffusion';
      case ImageProvider.GOOGLE_IMAGEN:
        return 'Gemini Imagen';
      default:
        return provider;
    }
  }
}

