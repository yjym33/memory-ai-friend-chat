export const productionConfig = {
  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: false, // 프로덕션에서는 절대 true로 하면 안됨
    logging: ['error', 'warn'], // 에러와 경고만 로깅
    dropSchema: false,
    migrationsRun: true,
    ssl: {
      rejectUnauthorized: false, // 클라우드 DB 사용시
    },
  },

  // 서버 설정
  server: {
    port: parseInt(process.env.PORT) || 8080,
    host: process.env.HOST || '0.0.0.0',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
      optionsSuccessStatus: 200,
    },
    trustProxy: true, // 로드 밸런서 뒤에 있을 때
  },

  // 로깅 설정
  logging: {
    level: 'info',
    format: 'json',
    enableConsole: false,
    enableFile: true,
    maxFiles: 30,
    maxSize: '50m',
    datePattern: 'YYYY-MM-DD',
    compress: true,
  },

  // JWT 설정
  jwt: {
    secret: process.env.JWT_SECRET, // 반드시 환경변수에서 가져와야 함
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: '7d',
    issuer: process.env.JWT_ISSUER || 'chatbot-api',
    audience: process.env.JWT_AUDIENCE || 'chatbot-client',
  },

  // 파일 업로드 설정
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB (프로덕션에서는 더 제한적)
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
    ],
    uploadPath: process.env.UPLOAD_PATH || '/app/uploads',
    tempPath: process.env.TEMP_PATH || '/app/uploads/temp',
    quarantinePath: process.env.QUARANTINE_PATH || '/app/quarantine',
    enableVirusScanning: true,
    enableContentFiltering: true,
  },

  // 캐시 설정
  cache: {
    ttl: 30 * 60 * 1000, // 30분
    maxSize: 1000,
    enableRedis: true, // 프로덕션에서는 Redis 사용
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      keyPrefix: 'chatbot:',
    },
  },

  // 성능 모니터링 설정
  monitoring: {
    enabled: true,
    metricsHistorySize: 10000,
    alertThresholds: {
      cpu: 70, // 프로덕션에서는 더 엄격하게
      memory: 80,
      disk: 85,
      responseTime: 1000,
      errorRate: 1,
    },
    collectInterval: 30000, // 30초
    enableAlerting: true,
    alertWebhook: process.env.ALERT_WEBHOOK_URL,
  },

  // AI 설정
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4000,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      timeout: 60000, // 1분
      organization: process.env.OPENAI_ORG_ID,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15분
      max: 50, // 프로덕션에서는 제한적
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    },
  },

  // 보안 설정
  security: {
    bcryptRounds: 12, // 프로덕션에서는 높게
    rateLimiting: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: true,
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: 'no-referrer' },
      xssFilter: true,
    },
  },

  // 이메일 설정
  email: {
    enabled: true,
    provider: 'smtp',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || 'AI Chatbot',
      address: process.env.EMAIL_FROM_ADDRESS,
    },
  },

  // WebSocket 설정
  websocket: {
    enabled: true,
    port: parseInt(process.env.WS_PORT) || 8081,
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
    heartbeatInterval: 25000,
    maxConnections: parseInt(process.env.MAX_WS_CONNECTIONS) || 10000,
    enableCompression: true,
    perMessageDeflate: {
      threshold: 1024,
      concurrencyLimit: 10,
      memLevel: 7,
    },
  },

  // 프로덕션 전용 설정
  production: {
    enableSwagger: false,
    enableGraphQLPlayground: false,
    enableDebugRoutes: false,
    seedDatabase: false,
    mockExternalServices: false,
    enableMetrics: true,
    enableHealthCheck: true,
    gracefulShutdownTimeout: 30000,
    cluster: {
      enabled: process.env.CLUSTER_ENABLED === 'true',
      workers:
        parseInt(process.env.CLUSTER_WORKERS) || require('os').cpus().length,
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
      requestTimeout: 60000,
      sniffOnStart: true,
    },
    sentry: {
      enabled: process.env.SENTRY_ENABLED === 'true',
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
    },
    newrelic: {
      enabled: process.env.NEW_RELIC_ENABLED === 'true',
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
      appName: process.env.NEW_RELIC_APP_NAME || 'AI-Chatbot-API',
    },
  },
};
