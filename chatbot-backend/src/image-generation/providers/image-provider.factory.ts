import { Injectable } from '@nestjs/common';
import { DalleProvider } from './dalle.provider';
import { StabilityProvider } from './stability.provider';
import { GoogleImagenProvider } from './google-imagen.provider';
import { IImageProvider } from '../interfaces/image-provider.interface';
import { ImageProvider } from '../types/image.types';

/**
 * 이미지 Provider Factory
 * Provider 타입에 따라 적절한 Provider 인스턴스를 반환합니다.
 */
@Injectable()
export class ImageProviderFactory {
  constructor(
    private readonly dalleProvider: DalleProvider,
    private readonly stabilityProvider: StabilityProvider,
    private readonly googleImagenProvider: GoogleImagenProvider,
  ) {}

  /**
   * Provider 타입에 따라 적절한 Provider 인스턴스를 반환합니다.
   * @param provider - Provider 타입
   * @returns Provider 인스턴스
   */
  getProvider(provider: ImageProvider): IImageProvider {
    switch (provider) {
      case ImageProvider.DALLE:
        return this.dalleProvider;
      case ImageProvider.STABILITY:
        return this.stabilityProvider;
      case ImageProvider.GOOGLE_IMAGEN:
        return this.googleImagenProvider;
      default:
        throw new Error(`지원하지 않는 이미지 Provider: ${provider}`);
    }
  }

  /**
   * 모든 Provider 목록을 반환합니다.
   * @returns Provider 목록
   */
  getAllProviders(): IImageProvider[] {
    return [
      this.dalleProvider,
      this.stabilityProvider,
      this.googleImagenProvider,
    ];
  }

  /**
   * Provider 이름으로 Provider를 찾습니다.
   * @param name - Provider 이름 (문자열)
   * @returns Provider 인스턴스
   */
  getProviderByName(name: string): IImageProvider {
    const normalizedName = name.toLowerCase();

    if (normalizedName === 'dalle' || normalizedName === 'dall-e') {
      return this.dalleProvider;
    }
    if (
      normalizedName === 'stability' ||
      normalizedName === 'stable-diffusion'
    ) {
      return this.stabilityProvider;
    }
    if (
      normalizedName === 'google-imagen' ||
      normalizedName === 'imagen' ||
      normalizedName === 'nanobanana' ||
      normalizedName === 'gemini'
    ) {
      return this.googleImagenProvider;
    }

    throw new Error(`지원하지 않는 이미지 Provider: ${name}`);
  }
}

