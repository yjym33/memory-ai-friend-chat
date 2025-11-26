import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DalleProvider } from './providers/dalle.provider';
import { StabilityProvider } from './providers/stability.provider';
import { GoogleImagenProvider } from './providers/google-imagen.provider';
import { ImageProviderFactory } from './providers/image-provider.factory';
import { ImageAdapterService } from './services/image-adapter.service';
import { ImageOrchestratorService } from './services/image-orchestrator.service';
import { ImageGenerationController } from './image-generation.controller';
import { EncryptionService } from '../common/services/encryption.service';
import { User } from '../auth/entity/user.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';

/**
 * 이미지 생성 모듈
 * DALL-E, Stability AI, Google Imagen 등 다양한 이미지 생성 Provider를 통합 관리합니다.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, AiSettings])],
  controllers: [ImageGenerationController],
  providers: [
    EncryptionService,
    DalleProvider,
    StabilityProvider,
    GoogleImagenProvider,
    ImageProviderFactory,
    ImageAdapterService,
    ImageOrchestratorService,
  ],
  exports: [ImageAdapterService, ImageProviderFactory, ImageOrchestratorService],
})
export class ImageGenerationModule {}

