import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { IImageProvider } from '../interfaces/image-provider.interface';
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageProvider,
} from '../types/image.types';

/**
 * Google Imagen (Nano Banana) 이미지 생성 Provider
 * Google의 Gemini 2.0 Flash Image 기술을 사용합니다.
 * 한글 텍스트 지원이 우수하며 기존 Google API 키를 재사용할 수 있습니다.
 */
@Injectable()
export class GoogleImagenProvider implements IImageProvider {
  private readonly logger = new Logger(GoogleImagenProvider.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GOOGLE_API_KEY') || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Google Imagen을 사용하여 이미지를 생성합니다.
   */
  async generateImage(
    request: ImageGenerationRequest,
    apiKey?: string,
  ): Promise<ImageGenerationResponse> {
    const client = apiKey ? new GoogleGenerativeAI(apiKey) : this.genAI;

    const model = request.model || this.getDefaultModel();

    this.logger.log(`🎨 Google Imagen 이미지 생성 시작: ${model}`);
    this.logger.debug(`프롬프트: ${request.prompt.substring(0, 100)}...`);

    try {
      // Gemini 2.0 Flash를 사용한 이미지 생성
      const generativeModel = client.getGenerativeModel({
        model: model,
        generationConfig: {
          // @ts-ignore - responseModalities는 최신 API에서 지원
          responseModalities: ['Text', 'Image'],
        },
      });

      // 이미지 생성 프롬프트 구성
      const imagePrompt = `Generate an image based on this description: ${request.prompt}. 
      Please create a high-quality, detailed image.`;

      const result = await generativeModel.generateContent(imagePrompt);
      const response = result.response;

      // 이미지 데이터 추출
      const images: Array<{
        url: string;
        base64?: string;
        width: number;
        height: number;
      }> = [];

      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          // inlineData가 있고 이미지 타입인 경우
          if (
            part.inlineData?.mimeType?.startsWith('image/') &&
            part.inlineData?.data
          ) {
            const base64Data = part.inlineData.data;
            const mimeType = part.inlineData.mimeType;
            images.push({
              url: `data:${mimeType};base64,${base64Data}`,
              base64: base64Data,
              width: 1024,
              height: 1024,
            });
          }
        }
      }

      // 이미지가 생성되지 않은 경우, 텍스트 응답 확인
      if (images.length === 0) {
        // Gemini가 이미지 대신 텍스트를 반환한 경우
        const textResponse = response.text();
        this.logger.warn(
          `Google Imagen이 이미지 대신 텍스트를 반환: ${textResponse.substring(0, 200)}`,
        );
        throw new Error(
          'Google Imagen에서 이미지를 생성하지 못했습니다. 다른 프롬프트로 시도해주세요.',
        );
      }

      this.logger.log(`✅ Google Imagen 이미지 생성 완료: ${images.length}개`);

      return {
        images,
        model,
        provider: ImageProvider.GOOGLE_IMAGEN,
        usage: {
          cost: this.estimateCost(images.length),
        },
      };
    } catch (error) {
      this.logger.error(`❌ Google Imagen 이미지 생성 실패: ${error.message}`);

      const errorMessage = error.message || '';

      // 할당량 초과 에러 (429 Too Many Requests)
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('Too Many Requests') ||
        errorMessage.includes('exceeded')
      ) {
        throw new Error(
          '⚠️ Google Gemini API 무료 티어 할당량이 초과되었습니다.\n\n' +
            '해결 방법:\n' +
            '1. 잠시 후 다시 시도해주세요 (약 10초 대기)\n' +
            '2. Google Cloud Console에서 유료 플랜으로 업그레이드\n' +
            '3. AI 설정에서 DALL-E 또는 Stability AI를 사용해주세요.',
        );
      }

      // 이미지 생성 지원되지 않음
      if (errorMessage.includes('not supported')) {
        throw new Error(
          'Google Imagen 이미지 생성이 현재 지원되지 않습니다. DALL-E 또는 Stability AI를 사용해주세요.',
        );
      }

      // API 키 오류
      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new Error('Google API 키가 유효하지 않습니다.');
      }

      // 권한 오류 (403)
      if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
        throw new Error(
          '⚠️ Google Gemini API 접근 권한이 없습니다.\n\n' +
            '해결 방법:\n' +
            '1. Google Cloud Console에서 Gemini API를 활성화해주세요\n' +
            '2. API 키에 적절한 권한이 부여되었는지 확인해주세요\n' +
            '3. 일부 지역에서는 결제 활성화가 필요할 수 있습니다.',
        );
      }

      throw error;
    }
  }

  /**
   * 예상 비용을 계산합니다 (USD).
   * Gemini API는 이미지 생성에 대한 별도 비용이 있을 수 있습니다.
   */
  private estimateCost(count: number): number {
    // Gemini 이미지 생성 비용 (추정치)
    return 0.02 * count;
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
      'gemini-2.0-flash-exp', // Gemini 2.0 Flash (이미지 생성 지원)
      'gemini-2.0-flash-preview-image-generation', // 이미지 생성 전용 모델
    ];
  }

  /**
   * Provider 이름을 반환합니다.
   */
  getName(): string {
    return 'Google Imagen (Nano Banana)';
  }

  /**
   * 기본 모델을 반환합니다.
   */
  getDefaultModel(): string {
    return 'gemini-2.0-flash-exp';
  }

  /**
   * 지원되는 이미지 크기 목록을 반환합니다.
   */
  getSupportedSizes(): string[] {
    return ['1024x1024'];
  }
}

