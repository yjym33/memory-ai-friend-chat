import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImageAdapterService } from './services/image-adapter.service';
import { ImageOrchestratorService } from './services/image-orchestrator.service';
import { AuthenticatedRequest } from '../common/types/request.types';
import { GenerateImageDto } from './dto/generate-image.dto';
import { ImageProvider } from './types/image.types';

/**
 * 이미지 생성 컨트롤러
 * 이미지 생성 관련 API 엔드포인트를 제공합니다.
 */
@Controller('image')
@UseGuards(JwtAuthGuard)
export class ImageGenerationController {
  constructor(
    private readonly imageAdapterService: ImageAdapterService,
    private readonly imageOrchestratorService: ImageOrchestratorService,
  ) {}

  /**
   * 이미지 생성
   * POST /image/generate
   */
  @Post('generate')
  async generateImage(
    @Body() dto: GenerateImageDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const result = await this.imageAdapterService.generateImage(
        req.user.userId,
        dto.prompt,
        {
          negativePrompt: dto.negativePrompt,
          size: dto.size,
          quality: dto.quality,
          style: dto.style,
          n: dto.n,
        },
      );

      return {
        success: true,
        data: result,
        message: `${result.images.length}개의 이미지가 생성되었습니다.`,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || '이미지 생성 중 오류가 발생했습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * 사용 가능한 이미지 모델 목록
   * GET /image/models
   */
  @Get('models')
  getAvailableModels(@Query('provider') providerStr?: string) {
    let provider: ImageProvider | undefined;

    if (providerStr) {
      provider =
        providerStr.toLowerCase() === 'dalle'
          ? ImageProvider.DALLE
          : providerStr.toLowerCase() === 'stability'
            ? ImageProvider.STABILITY
            : undefined;
    }

    return {
      success: true,
      models: this.imageAdapterService.getAvailableModels(provider),
    };
  }

  /**
   * 사용 가능한 이미지 크기 목록
   * GET /image/sizes
   */
  @Get('sizes')
  getSupportedSizes(
    @Query('provider') providerStr?: string,
    @Query('model') model?: string,
  ) {
    // 기본값: DALL-E
    const provider =
      providerStr?.toLowerCase() === 'stability'
        ? ImageProvider.STABILITY
        : ImageProvider.DALLE;

    return {
      success: true,
      sizes: this.imageAdapterService.getSupportedSizes(provider, model),
    };
  }

  /**
   * 사용 가능한 Provider 목록
   * GET /image/providers
   */
  @Get('providers')
  getAvailableProviders() {
    return {
      success: true,
      providers: this.imageAdapterService.getAvailableProviders(),
    };
  }

  // =====================================
  // Multi-Image Orchestrator 엔드포인트
  // =====================================

  /**
   * 사용 가능한 이미지 Provider 정보 목록 (Multi-Image용)
   * GET /image/multi/providers
   */
  @Get('multi/providers')
  getMultiImageProviders() {
    return {
      success: true,
      providers: this.imageOrchestratorService.getProviderInfo(),
      available: this.imageOrchestratorService.getAvailableProviders(),
    };
  }

  /**
   * 여러 이미지 생성 Provider를 동시에 호출하여 복수의 이미지를 생성합니다.
   * POST /image/multi/generate
   */
  @Post('multi/generate')
  async generateMultiImages(
    @Body()
    body: {
      prompt: string;
      providers: string[];
      negativePrompt?: string;
      size?: string;
      quality?: string;
      style?: string;
    },
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      // Provider 문자열을 enum으로 변환
      const providers = body.providers
        .map((p) => this.parseImageProvider(p))
        .filter((p): p is ImageProvider => p !== null);

      if (providers.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: '유효한 이미지 Provider가 없습니다.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.imageOrchestratorService.generateMultiImages({
        providers,
        prompt: body.prompt,
        negativePrompt: body.negativePrompt,
        size: body.size as any,
        quality: body.quality as any,
        style: body.style as any,
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message || '이미지 생성 중 오류가 발생했습니다.',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Provider 문자열을 ImageProvider enum으로 변환합니다.
   */
  private parseImageProvider(provider: string): ImageProvider | null {
    const normalized = provider.toLowerCase();
    switch (normalized) {
      case 'dalle':
      case 'dall-e':
      case 'openai':
        return ImageProvider.DALLE;
      case 'stability':
      case 'stable-diffusion':
      case 'sd':
        return ImageProvider.STABILITY;
      case 'google-imagen':
      case 'gemini':
      case 'imagen':
        return ImageProvider.GOOGLE_IMAGEN;
      default:
        return null;
    }
  }
}

