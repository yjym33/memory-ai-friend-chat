import { registerAs } from '@nestjs/config';

/**
 * 보안 관련 설정
 * 환경별로 다른 보안 정책을 적용합니다.
 */
export default registerAs('security', () => ({
  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // CORS 설정
  cors: {
    origin: getCorsOrigin(),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },

  // 기타 보안 설정
  bodyParser: {
    limit: process.env.BODY_PARSER_LIMIT || '10mb', // 기본값을 10mb로 변경
  },
}));

/**
 * 환경별 CORS Origin 설정
 */
function getCorsOrigin(): string | string[] | boolean {
  const nodeEnv = process.env.NODE_ENV;

  switch (nodeEnv) {
    case 'production':
      // 운영환경에서는 명시된 프론트엔드 URL만 허용
      return process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
        : false;

    case 'test':
      // 테스트 환경에서는 localhost만 허용
      return ['http://localhost:3000', 'http://localhost:3001'];

    case 'development':
    default:
      // 개발환경에서는 설정된 URL 또는 기본값 사용
      return process.env.CORS_ORIGIN || 'http://localhost:3000';
  }
}
