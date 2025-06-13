import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { AppConfigModule } from './config/config.module';
import databaseConfig from './config/database.config';
import { AuthModule } from './auth/auth.module';
import { AiSettingsModule } from './ai-settings/ai-settings.module';
import { ConversationAnalyticsModule } from './conversation-analytics/conversation-analytics.module';
import { AgentModule } from './agent/agent.module';

/**
 * 애플리케이션의 루트 모듈
 * 모든 하위 모듈과 설정을 통합합니다.
 */
@Module({
  imports: [
    // 환경 설정 모듈
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),

    // 데이터베이스 설정
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // 개발 환경에서만 true로 설정
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    // 기능 모듈들
    AppConfigModule, // 애플리케이션 설정
    ChatModule, // 채팅 기능
    UploadModule, // 파일 업로드
    AuthModule, // 인증/인가
    AiSettingsModule, // AI 설정
    ConversationAnalyticsModule, // 대화 분석
    AgentModule, // AI 에이전트
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
