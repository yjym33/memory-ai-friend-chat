import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { logDirectory } from './config/logger.config';
import * as express from 'express';
import { Logger } from '@nestjs/common';

/**
 * 애플리케이션 부트스트랩 함수
 * 서버 초기화 및 기본 설정을 수행합니다.
 */
async function bootstrap() {
  // 임시 로거 (Winston 설정 전)
  const logger = new Logger('Bootstrap');

  logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.debug('🚀 애플리케이션 부트스트랩 시작');
  logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  logger.debug('[STEP 1/9] NestFactory.create(AppModule) 시작');
  const app = await NestFactory.create(AppModule);
  logger.debug('[STEP 1/9] ✅ AppModule 생성 완료');

  logger.debug('[STEP 2/9] ConfigService 가져오기');
  const configService = app.get(ConfigService);
  logger.debug('[STEP 2/9] ✅ ConfigService 가져오기 완료');

  logger.debug('[STEP 3/9] Body parser 설정 시작');
  const bodyParserLimit = configService.get<string>(
    'security.bodyParser.limit',
  );
  app.use(express.json({ limit: bodyParserLimit }));
  app.use(express.urlencoded({ limit: bodyParserLimit, extended: true }));
  logger.debug(
    `[STEP 3/9] ✅ Body parser 설정 완료 (limit: ${bodyParserLimit})`,
  );

  logger.debug('[STEP 4/9] 디렉토리 생성 시작');
  try {
    await mkdir('./uploads', { recursive: true });
    await mkdir(`./${logDirectory}`, { recursive: true });
    logger.debug('[STEP 4/9] ✅ 업로드 및 로그 디렉토리 생성 완료');
  } catch (error) {
    logger.error('[STEP 4/9] ❌ 디렉토리 생성 실패:', error);
  }

  logger.debug('[STEP 5/9] Winston 로거를 기본 로거로 설정');
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  logger.debug('[STEP 5/9] ✅ Winston 로거 설정 완료');

  // 이제 Winston 로거를 사용할 수 있음
  const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  winstonLogger.debug('[STEP 6/9] CORS 설정 시작');
  const corsConfig = configService.get('security.cors');
  app.enableCors(corsConfig);
  winstonLogger.debug('[STEP 6/9] ✅ CORS 설정 완료');

  winstonLogger.debug('[STEP 7/9] 서버 포트 설정');
  const port = configService.get<number>('PORT') || 8080;
  winstonLogger.debug(`[STEP 7/9] ✅ 포트 설정 완료: ${port}`);

  winstonLogger.debug('[STEP 8/9] 서버 시작 (app.listen)');
  await app.listen(port);

  winstonLogger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  winstonLogger.log(
    `🚀 Chatbot Backend 서버가 실행 중: http://localhost:${port}`,
  );
  winstonLogger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 애플리케이션 실행
bootstrap();
