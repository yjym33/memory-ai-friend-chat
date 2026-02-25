import { safeParseInt, safeParseFloat } from '../../common/utils/env.util';

export const developmentConfig = {
  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: safeParseInt(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'chatbot_dev',
    synchronize: true, // 개발 환경에서만 true
    logging: true,
    dropSchema: false,
    migrationsRun: false,
  },

  // 서버 설정
  server: {
    port: safeParseInt(process.env.PORT, 8080),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
      ],
      credentials: true,
    },
  },

  // 로깅 설정
  logging: {
    level: 'debug',
    format: 'pretty',
    enableConsole: true,
    enableFile: true,
    maxFiles: 5,
    maxSize: '10m',
    datePattern: 'YYYY-MM-DD',
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: '30d',
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ],
    uploadPath: './uploads',
    tempPath: './uploads/temp',
    quarantinePath: './quarantine',
  },

  // 캐시 설정
  cache: {
    ttl: 5 * 60 * 1000, // 5분
    maxSize: 100,
    enableRedis: false, // 개발 환경에서는 메모리 캐시 사용
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: safeParseInt(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD,
      db: 0,
    },
  },

  // 성능 모니터링 설정
  monitoring: {
    enabled: true,
    metricsHistorySize: 1000,
    alertThresholds: {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 2000,
      errorRate: 5,
    },
    collectInterval: 60000, // 1분
  },

  // AI 설정
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-5.2',
      maxTokens: 2000,
      temperature: 0.7,
      timeout: 30000,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 100, // 개발 환경에서는 넉넉하게
    },
  },

  // 보안 설정
  security: {
    bcryptRounds: 10, // 개발 환경에서는 낮게
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // 개발 환경에서는 관대하게
    },
    helmet: {
      contentSecurityPolicy: false, // 개발 환경에서는 비활성화
      crossOriginEmbedderPolicy: false,
    },
  },

  // OAuth 설정
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:8080/auth/google/callback',
    },
    kakao: {
      clientId: process.env.KAKAO_CLIENT_ID || '',
      callbackUrl:
        process.env.KAKAO_CALLBACK_URL ||
        'http://localhost:8080/auth/kakao/callback',
    },
  },

  // 이메일 설정 (개발 환경에서는 콘솔 출력)
  email: {
    enabled: false,
    provider: 'console',
    smtp: {
      host: 'localhost',
      port: 1025, // MailHog 등 개발용 SMTP
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    },
  },

  // WebSocket 설정
  websocket: {
    enabled: true,
    port: safeParseInt(process.env.WS_PORT, 8081),
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
    heartbeatInterval: 30000,
    maxConnections: 1000,
  },

  // 개발 도구 설정
  development: {
    enableSwagger: true,
    enableGraphQLPlayground: true,
    enableDebugRoutes: true,
    seedDatabase: true,
    mockExternalServices: true,
  },
};
