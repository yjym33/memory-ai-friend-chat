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
  constructor(private readonly imageAdapterService: ImageAdapterService) {}

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
}

