import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'fs/promises';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // body-parser를 비활성화
  });

  // body-parser 설정 추가
  app.use(require('body-parser').json({ limit: '100mb' }));
  app.use(
    require('body-parser').urlencoded({ limit: '100mb', extended: true }),
  );

  try {
    await mkdir('./uploads', { recursive: true });
  } catch (error) {
    console.error('업로드 디렉토리 생성 실패:', error);
  }

  // CORS 설정 (프론트엔드 http://localhost:3000 허용)
  app.enableCors({
    // origin: 'http://localhost:3000',
    // methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    // allowedHeaders: 'Content-Type, Authorization',

    origin: '*', // 모든 도메인 허용 (보안상 필요하면 특정 도메인만 허용)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8080;

  await app.listen(port);
  console.log(`🚀 Chatbot Backend 서버가 실행 중: http://localhost:${port}`);
}
bootstrap();
