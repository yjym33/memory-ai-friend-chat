import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'fs/promises';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { logDirectory } from './config/logger.config';

/**
 * 애플리케이션 부트스트랩 함수
 * 서버 초기화 및 기본 설정을 수행합니다.
 */
async function bootstrap() {
  // ConfigService 가져오기
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Body parser 설정 (보안 설정에서 가져오기)
  const bodyParserLimit = configService.get<string>(
    'security.bodyParser.limit',
  );
  app.use(require('express').json({ limit: bodyParserLimit }));
  app.use(
    require('express').urlencoded({ limit: bodyParserLimit, extended: true }),
  );

  // 필요한 디렉토리들 생성
  try {
    await mkdir('./uploads', { recursive: true });
    await mkdir(`./${logDirectory}`, { recursive: true });
    console.log('✅ 업로드 및 로그 디렉토리 생성 완료');
  } catch (error) {
    console.error('❌ 디렉토리 생성 실패:', error);
  }

  // Winston 로거를 기본 로거로 설정
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // CORS 설정 (보안 설정에서 가져오기)
  const corsConfig = configService.get('security.cors');
  app.enableCors(corsConfig);

  // 서버 포트 설정
  const port = configService.get<number>('PORT') || 8080;

  // 서버 시작
  await app.listen(port);
  console.log(`🚀 Chatbot Backend 서버가 실행 중: http://localhost:${port}`);
}

// 애플리케이션 실행
bootstrap();
