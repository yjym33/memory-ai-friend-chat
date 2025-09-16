import { safeParseInt, safeParseFloat } from '../../common/utils/env.util';

export const stagingConfig = {
  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: safeParseInt(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'chatbot_staging',
    synchronize: false, // 스테이징에서도 false
    logging: ['error', 'warn', 'migration'],
    dropSchema: false,
    migrationsRun: true,
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: false,
          }
        : false,
  },

  // 서버 설정
  server: {
    port: safeParseInt(process.env.PORT, 8080),
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'https://staging.chatbot.com',
        'http://localhost:3000', // 개발자 테스트용
      ],
      credentials: true,
    },
  },

  // 로깅 설정
  logging: {
    level: 'debug', // 스테이징에서는 디버그 정보도 필요
    format: 'json',
    enableConsole: true,
    enableFile: true,
    maxFiles: 14,
    maxSize: '20m',
    datePattern: 'YYYY-MM-DD',
    compress: true,
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: '14d',
    issuer: process.env.JWT_ISSUER || 'chatbot-api-staging',
    audience: process.env.JWT_AUDIENCE || 'chatbot-client-staging',
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: 75 * 1024 * 1024, // 75MB (개발과 프로덕션 중간)
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
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    tempPath: process.env.TEMP_PATH || './uploads/temp',
    quarantinePath: process.env.QUARANTINE_PATH || './quarantine',
    enableVirusScanning: true,
    enableContentFiltering: true,
  },

  // 캐시 설정
  cache: {
    ttl: 15 * 60 * 1000, // 15분
    maxSize: 500,
    enableRedis: process.env.REDIS_ENABLED === 'true',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: safeParseInt(process.env.REDIS_PORT, 6379),
      password: process.env.REDIS_PASSWORD,
      db: safeParseInt(process.env.REDIS_DB, 1), // 스테이징용 DB
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      keyPrefix: 'chatbot:staging:',
    },
  },

  // 성능 모니터링 설정
  monitoring: {
    enabled: true,
    metricsHistorySize: 5000,
    alertThresholds: {
      cpu: 75,
      memory: 82,
      disk: 88,
      responseTime: 1500,
      errorRate: 3,
    },
    collectInterval: 45000, // 45초
    enableAlerting: true,
    alertWebhook: process.env.STAGING_ALERT_WEBHOOK_URL,
  },

  // AI 설정
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: safeParseInt(process.env.OPENAI_MAX_TOKENS, 3000),
      temperature: safeParseFloat(process.env.OPENAI_TEMPERATURE, 0.7),
      timeout: 45000,
      organization: process.env.OPENAI_ORG_ID,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 75, // 개발과 프로덕션 중간
      skipSuccessfulRequests: false,
    },
  },

  // 보안 설정
  security: {
    bcryptRounds: 11, // 중간 수준
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      max: 200, // 테스트를 위해 관대하게
      standardHeaders: true,
      legacyHeaders: false,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-eval'"], // 스테이징에서는 디버깅 허용
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false, // 스테이징에서는 완화
      crossOriginOpenerPolicy: false,
      dnsPrefetchControl: true,
      frameguard: { action: 'sameorigin' },
      hidePoweredBy: true,
      hsts: false, // HTTPS 강제하지 않음
      ieNoOpen: true,
      noSniff: true,
      referrerPolicy: { policy: 'same-origin' },
      xssFilter: true,
    },
  },

  // 이메일 설정
  email: {
    enabled: true,
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: safeParseInt(process.env.SMTP_PORT, 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'AI Chatbot (Staging)',
      address: process.env.EMAIL_FROM_ADDRESS,
    },
    testMode: true, // 스테이징에서는 테스트 모드
  },

  // WebSocket 설정
  websocket: {
    enabled: true,
    port: safeParseInt(process.env.WS_PORT, 8081),
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'https://staging.chatbot.com',
        'http://localhost:3000',
      ],
      credentials: true,
    },
    heartbeatInterval: 30000,
    maxConnections: safeParseInt(process.env.MAX_WS_CONNECTIONS, 1000),
    enableCompression: true,
  },

  // 스테이징 전용 설정
  staging: {
    enableSwagger: true, // API 문서 확인용
    enableGraphQLPlayground: true,
    enableDebugRoutes: true, // 디버깅 라우트 활성화
    seedDatabase: process.env.SEED_DATABASE === 'true',
    mockExternalServices: process.env.MOCK_EXTERNAL === 'true',
    enableTestData: true,
    resetDatabaseOnDeploy: process.env.RESET_DB_ON_DEPLOY === 'true',
  },

  // 테스트 설정
  testing: {
    enableTestRoutes: true,
    allowDataReset: true,
    mockPayments: true,
    mockNotifications: true,
    enablePerformanceTesting: true,
    loadTestingLimits: {
      maxConcurrentUsers: 100,
      maxRequestsPerSecond: 50,
    },
  },

  // 외부 서비스 설정
  external: {
    elasticsearch: {
      enabled: process.env.ELASTICSEARCH_ENABLED === 'true',
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      },
      maxRetries: 3,
      requestTimeout: 30000,
    },
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: 'staging',
      tracesSampleRate: 0.5, // 스테이징에서는 더 많은 트레이스
      debug: true,
    },
    analytics: {
      enabled: process.env.ANALYTICS_ENABLED === 'true',
      provider: 'mixpanel',
      apiKey: process.env.MIXPANEL_API_KEY,
      testMode: true,
    },
  },

  // 데이터베이스 시딩 설정
  seeds: {
    users: {
      admin: {
        email: 'admin@staging.chatbot.com',
        password: 'staging-admin-password',
        role: 'admin',
      },
      testUser: {
        email: 'test@staging.chatbot.com',
        password: 'test-password',
        role: 'user',
      },
    },
    conversations: {
      createSampleData: true,
      count: 50,
    },
  },
};
