import {
  Module,
  MiddlewareConsumer,
  NestModule,
  OnModuleInit,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { AppConfigModule } from './config/config.module';
import databaseConfig from './config/database.config';
import securityConfig from './config/security.config';
import { validate } from './config/env.validation';
import { createLoggerConfig } from './config/logger.config';
import { AuthModule } from './auth/auth.module';
import { AiSettingsModule } from './ai-settings/ai-settings.module';
import { ConversationAnalyticsModule } from './conversation-analytics/conversation-analytics.module';
import { AgentModule } from './agent/agent.module';
import { DocumentModule } from './document/document.module';
import { AdminModule } from './admin/admin.module';
import { LLMModule } from './llm/llm.module';
import { ImageGenerationModule } from './image-generation/image-generation.module';
import { DatabaseConfigService } from './config/database.config.service';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

/**
 * 애플리케이션의 루트 모듈
 * 모든 하위 모듈과 설정을 통합합니다.
 */
@Module({
  imports: [
    // 환경 설정 모듈 (환경변수 검증 포함)
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, securityConfig],
      validate, // 환경변수 검증 함수 추가
    }),

    // Winston 로거 모듈
    WinstonModule.forRoot(createLoggerConfig()),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfigService,
    }),

    // 기능 모듈들
    AppConfigModule, // 애플리케이션 설정
    ChatModule, // 채팅 기능
    UploadModule, // 파일 업로드
    AuthModule, // 인증/인가
    AiSettingsModule, // AI 설정
    ConversationAnalyticsModule, // 대화 분석
    AgentModule, // AI 에이전트
    DocumentModule, // 문서 관리
    AdminModule, // 관리자
    LLMModule, // LLM 통합 모듈
    ImageGenerationModule, // 이미지 생성 모듈
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 글로벌 예외 필터 등록
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule
  implements NestModule, OnModuleInit, OnApplicationBootstrap
{
  private readonly logger = new Logger(AppModule.name);

  constructor() {
    this.logger.debug(
      '[AppModule] Constructor 실행 - 모든 하위 모듈 인스턴스 생성 완료',
    );
  }

  configure(consumer: MiddlewareConsumer) {
    this.logger.debug('[AppModule] configure() 실행 - 미들웨어 설정 시작');
    consumer.apply(LoggerMiddleware).forRoutes('*');
    this.logger.debug('[AppModule] configure() 완료 - LoggerMiddleware 등록됨');
  }

  onModuleInit() {
    this.logger.debug(
      '[AppModule] onModuleInit() 실행 - 모든 모듈 초기화 완료',
    );
    this.logger.debug(
      '[AppModule] - 하위 모듈들이 모두 로드되고 의존성 주입 완료',
    );
  }

  async onApplicationBootstrap() {
    this.logger.debug(
      '[AppModule] onApplicationBootstrap() 실행 - 애플리케이션 부트스트랩 완료',
    );
    this.logger.debug(
      '[AppModule] - 서버가 시작되기 직전, 모든 초기화 작업 완료',
    );
  }
}
