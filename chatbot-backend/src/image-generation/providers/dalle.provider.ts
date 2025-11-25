import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { IImageProvider } from '../interfaces/image-provider.interface';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageProvider,
  ImageSize,
} from '../types/image.types';

/**
 * DALL-E (OpenAI) 이미지 생성 Provider
 * OpenAI의 DALL-E 모델을 사용하여 이미지를 생성합니다.
 */
@Injectable()
export class DalleProvider implements IImageProvider {
  private readonly logger = new Logger(DalleProvider.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * DALL-E를 사용하여 이미지를 생성합니다.
   */
  async generateImage(
    request: ImageGenerationRequest,
    apiKey?: string,
  ): Promise<ImageGenerationResponse> {
    const client = apiKey ? new OpenAI({ apiKey }) : this.openai;
    const model = request.model || this.getDefaultModel();

    this.logger.log(`🎨 DALL-E 이미지 생성 시작: ${model}`);
    this.logger.debug(`프롬프트: ${request.prompt.substring(0, 100)}...`);

    try {
      const normalizedSize = this.normalizeSize(
        request.size || '1024x1024',
        model,
      );

      const response = await client.images.generate({
        model: model as 'dall-e-2' | 'dall-e-3',
        prompt: request.prompt,
        n: model === 'dall-e-3' ? 1 : request.n || 1, // DALL-E 3는 한 번에 1개만 생성
        size: normalizedSize,
        quality:
          model === 'dall-e-3' ? request.quality || 'standard' : undefined,
        style: model === 'dall-e-3' ? request.style || 'vivid' : undefined,
        response_format: 'url',
      });

      const [width, height] = (request.size || '1024x1024')
        .split('x')
        .map(Number);

      if (!response.data || response.data.length === 0) {
        throw new Error('DALL-E에서 이미지를 생성하지 못했습니다.');
      }

      const images = response.data.map((img) => ({
        url: img.url!,
        revisedPrompt: img.revised_prompt,
        width,
        height,
      }));

      this.logger.log(`✅ DALL-E 이미지 생성 완료: ${images.length}개`);

      return {
        images,
        model,
        provider: ImageProvider.DALLE,
        usage: {
          cost: this.estimateCost(
            model,
            request.size,
            request.quality,
            images.length,
          ),
        },
      };
    } catch (error) {
      this.logger.error(`❌ DALL-E 이미지 생성 실패: ${error.message}`);
      throw error;
    }
  }

  /**
   * 이미지 크기를 DALL-E 모델에 맞게 정규화합니다.
   */
  private normalizeSize(
    size: ImageSize,
    model: string,
  ): '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792' {
    // DALL-E 2는 제한된 크기만 지원
    if (model === 'dall-e-2') {
      const validSizes = ['256x256', '512x512', '1024x1024'];
      return validSizes.includes(size)
        ? (size as '256x256' | '512x512' | '1024x1024')
        : '1024x1024';
    }
    // DALL-E 3 지원 크기
    const dalle3Sizes = ['1024x1024', '1792x1024', '1024x1792'];
    return dalle3Sizes.includes(size)
      ? (size as '1024x1024' | '1792x1024' | '1024x1792')
      : '1024x1024';
  }

  /**
   * 예상 비용을 계산합니다 (USD).
   */
  private estimateCost(
    model: string,
    size?: ImageSize,
    quality?: string,
    count?: number,
  ): number {
    const n = count || 1;

    // DALL-E 3 가격 (2024년 기준)
    const dalle3Prices: Record<string, number> = {
      '1024x1024-standard': 0.04,
      '1024x1024-hd': 0.08,
      '1792x1024-standard': 0.08,
      '1792x1024-hd': 0.12,
      '1024x1792-standard': 0.08,
      '1024x1792-hd': 0.12,
    };

    // DALL-E 2 가격
    const dalle2Prices: Record<string, number> = {
      '256x256': 0.016,
      '512x512': 0.018,
      '1024x1024': 0.02,
    };

    if (model === 'dall-e-3') {
      const key = `${size || '1024x1024'}-${quality || 'standard'}`;
      return (dalle3Prices[key] || 0.04) * n;
    }

    return (dalle2Prices[size || '1024x1024'] || 0.02) * n;
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
    return ['dall-e-3', 'dall-e-2'];
  }

  /**
   * Provider 이름을 반환합니다.
   */
  getName(): string {
    return 'DALL-E (OpenAI)';
  }

  /**
   * 기본 모델을 반환합니다.
   */
  getDefaultModel(): string {
    return 'dall-e-3';
  }

  /**
   * 지원되는 이미지 크기 목록을 반환합니다.
   */
  getSupportedSizes(model?: string): string[] {
    if (model === 'dall-e-2') {
      return ['256x256', '512x512', '1024x1024'];
    }
    // DALL-E 3
    return ['1024x1024', '1792x1024', '1024x1792'];
  }
}

