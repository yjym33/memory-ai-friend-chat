import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiSettingsController } from './ai-settings.controller';
import { AiSettingsService } from './ai-settings.service';
import { AiSettings } from './entity/ai-settings.entity';

/**
 * AI 설정 관련 기능을 제공하는 모듈
 * 사용자별 AI 설정의 관리 기능을 제공합니다.
 */
@Module({
  imports: [
    // 데이터베이스 엔티티 등록
    TypeOrmModule.forFeature([AiSettings]),
  ],
  controllers: [AiSettingsController],
  providers: [AiSettingsService],
  exports: [AiSettingsService], // 다른 모듈에서 사용 가능하도록 내보내기
})
export class AiSettingsModule {}
