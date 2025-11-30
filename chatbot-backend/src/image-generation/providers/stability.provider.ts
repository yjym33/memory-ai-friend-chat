import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IImageProvider } from '../interfaces/image-provider.interface';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageProvider,
} from '../types/image.types';

/**
 * Stability AI (Stable Diffusion) 이미지 생성 Provider
 * Stability AI API를 사용하여 이미지를 생성합니다.
 */
@Injectable()
export class StabilityProvider implements IImageProvider {
  private readonly logger = new Logger(StabilityProvider.name);
  private readonly apiUrl = 'https://api.stability.ai/v1/generation';

  constructor(private configService: ConfigService) {}

  /**
   * Stability AI를 사용하여 이미지를 생성합니다.
   */
  async generateImage(
    request: ImageGenerationRequest,
    apiKey?: string,
  ): Promise<ImageGenerationResponse> {
    const key = apiKey || this.configService.get<string>('STABILITY_API_KEY');
    if (!key) {
      throw new Error(
        'Stability AI API 키가 설정되지 않았습니다. 환경 변수 STABILITY_API_KEY를 설정하거나 AI 설정에서 API 키를 입력해주세요.',
      );
    }

    const model = request.model || this.getDefaultModel();
    const [width, height] = this.normalizeSize(request.size || '1024x1024');

    this.logger.log(`🎨 Stability AI 이미지 생성 시작: ${model}`);
    this.logger.debug(`프롬프트: ${request.prompt.substring(0, 100)}...`);

    try {
      // Text prompts 구성
      const textPrompts = [{ text: request.prompt, weight: 1 }];

      // Negative prompt 추가 (있는 경우)
      if (request.negativePrompt) {
        textPrompts.push({ text: request.negativePrompt, weight: -1 });
      }

      const response = await axios.post(
        `${this.apiUrl}/${model}/text-to-image`,
        {
          text_prompts: textPrompts,
          cfg_scale: 7, // Classifier Free Guidance scale
          width,
          height,
          samples: request.n || 1, // 생성할 이미지 수
          steps: 30, // 생성 단계 수
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      interface StabilityArtifact {
        base64: string;
        finishReason?: string;
        seed?: number;
      }

      const images = response.data.artifacts.map((artifact: StabilityArtifact) => ({
        url: `data:image/png;base64,${artifact.base64}`,
        base64: artifact.base64,
        width,
        height,
      }));

      this.logger.log(`✅ Stability AI 이미지 생성 완료: ${images.length}개`);

      return {
        images,
        model,
        provider: ImageProvider.STABILITY,
        usage: {
          cost: this.estimateCost(model, images.length),
        },
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || error.message || '알 수 없는 오류';
        this.logger.error(`❌ Stability AI 이미지 생성 실패: ${errorMessage}`);

        if (error.response?.status === 401) {
          throw new Error('Stability AI API 키가 유효하지 않습니다.');
        }
        if (error.response?.status === 403) {
          throw new Error('Stability AI API 접근 권한이 없습니다.');
        }
        if (error.response?.status === 429) {
          throw new Error('Stability AI API 요청 한도를 초과했습니다.');
        }

        throw new Error(`Stability AI 오류: ${errorMessage}`);
      }
      throw error;
    }
  }

  /**
   * 이미지 크기를 Stability AI에 맞게 정규화합니다.
   * Stability AI는 64의 배수만 지원합니다.
   */
  private normalizeSize(size: string): [number, number] {
    const sizeMap: Record<string, [number, number]> = {
      '256x256': [256, 256],
      '512x512': [512, 512],
      '768x768': [768, 768],
      '1024x1024': [1024, 1024],
      '1792x1024': [1792, 1024], // SDXL 지원
      '1024x1792': [1024, 1792], // SDXL 지원
    };

    return sizeMap[size] || [1024, 1024];
  }

  /**
   * 예상 비용을 계산합니다 (USD).
   * Stability AI는 크레딧 기반으로, 대략적인 비용을 계산합니다.
   */
  private estimateCost(model: string, count: number): number {
    // SDXL: 약 $0.002/이미지 (크레딧 기반)
    // SD 1.6: 약 $0.001/이미지
    const pricePerImage = model.includes('xl') ? 0.002 : 0.001;
    return pricePerImage * count;
  }

  /**
   * 모델이 유효한지 검증합니다.
   */
  validateModel(model: string): boolean {
    return this.getAvailableModels().includes(model);
  }

  /**
   * 사용 가능한 모델 목록을 반환합니다.
   */
  getAvailableModels(): string[] {
    return [
      'stable-diffusion-xl-1024-v1-0', // SDXL 1.0
      'stable-diffusion-v1-6', // SD 1.6
    ];
  }

  /**
   * Provider 타입(enum 값)을 반환합니다.
   */
  getProviderType(): ImageProvider {
    return ImageProvider.STABILITY;
  }

  /**
   * Provider 이름을 반환합니다.
   */
  getName(): string {
    return 'Stability AI';
  }

  /**
   * 기본 모델을 반환합니다.
   */
  getDefaultModel(): string {
    return 'stable-diffusion-xl-1024-v1-0';
  }

  /**
   * 지원되는 이미지 크기 목록을 반환합니다.
   */
  getSupportedSizes(model?: string): string[] {
    if (model === 'stable-diffusion-xl-1024-v1-0') {
      // SDXL은 더 큰 크기 지원
      return ['512x512', '768x768', '1024x1024', '1792x1024', '1024x1792'];
    }
    // SD 1.6
    return ['256x256', '512x512', '768x768'];
  }
}

