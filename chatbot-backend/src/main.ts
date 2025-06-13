import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'fs/promises';
import * as bodyParser from 'body-parser';

/**
 * 애플리케이션 부트스트랩 함수
 * 서버 초기화 및 기본 설정을 수행합니다.
 */
async function bootstrap() {
  // NestJS 애플리케이션 인스턴스 생성
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // 기본 body-parser 비활성화 (커스텀 설정 사용)
  });

  // 커스텀 body-parser 설정
  // 대용량 파일 업로드를 위해 limit을 100mb로 설정
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  // 업로드 디렉토리 생성
  try {
    await mkdir('./uploads', { recursive: true });
    console.log('✅ 업로드 디렉토리 생성 완료');
  } catch (error) {
    console.error('❌ 업로드 디렉토리 생성 실패:', error);
  }

  // CORS 설정
  app.enableCors({
    origin: '*', // 개발 환경에서는 모든 도메인 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // 서버 포트 설정
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8080;

  // 서버 시작
  await app.listen(port);
  console.log(`🚀 Chatbot Backend 서버가 실행 중: http://localhost:${port}`);
}

// 애플리케이션 실행
bootstrap();
