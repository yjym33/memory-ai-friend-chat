import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LLMProviderFactory } from './providers/llm-provider.factory';
import { OpenAIProvider } from './providers/openai.provider';
import { GoogleProvider } from './providers/google.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { LLMAdapterService } from './services/llm-adapter.service';
import { EncryptionService } from '../common/services/encryption.service';
import { User } from '../auth/entity/user.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';

/**
 * LLM 모듈
 * 다양한 AI 모델 Provider를 통합 관리합니다.
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User, AiSettings])],
  providers: [
    EncryptionService,
    OpenAIProvider,
    GoogleProvider,
    AnthropicProvider,
    LLMProviderFactory,
    LLMAdapterService,
  ],
  exports: [LLMAdapterService, LLMProviderFactory, EncryptionService],
})
export class LLMModule {}
