import { developmentConfig } from './environments/development.config';
import { stagingConfig } from './environments/staging.config';
import { productionConfig } from './environments/production.config';

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface AppConfig {
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    synchronize: boolean;
    logging: boolean | string[];
    dropSchema: boolean;
    migrationsRun: boolean;
    ssl?: any;
  };
  server: {
    port: number;
    host: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
      optionsSuccessStatus?: number;
    };
    trustProxy?: boolean;
  };
  logging: {
    level: string;
    format: string;
    enableConsole: boolean;
    enableFile: boolean;
    maxFiles: number | string;
    maxSize: string;
    datePattern: string;
    compress?: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    issuer?: string;
    audience?: string;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    uploadPath: string;
    tempPath: string;
    quarantinePath: string;
    enableVirusScanning?: boolean;
    enableContentFiltering?: boolean;
  };
  cache: {
    ttl: number;
    maxSize: number;
    enableRedis: boolean;
    redis?: {
      host: string;
      port: number;
      password?: string;
      db: number;
      retryDelayOnFailover?: number;
      enableReadyCheck?: boolean;
      maxRetriesPerRequest?: number;
      lazyConnect?: boolean;
      keepAlive?: number;
      family?: number;
      keyPrefix?: string;
    };
  };
  monitoring: {
    enabled: boolean;
    metricsHistorySize: number;
    alertThresholds: {
      cpu: number;
      memory: number;
      disk: number;
      responseTime: number;
      errorRate: number;
    };
    collectInterval: number;
    enableAlerting?: boolean;
    alertWebhook?: string;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
      temperature: number;
      timeout: number;
      organization?: string;
    };
    rateLimit: {
      windowMs: number;
      max: number;
      skipSuccessfulRequests?: boolean;
      skipFailedRequests?: boolean;
    };
  };
  security: {
    bcryptRounds: number;
    rateLimiting: {
      windowMs: number;
      max: number;
      standardHeaders?: boolean;
      legacyHeaders?: boolean;
    };
    helmet: any;
  };
  email: {
    enabled: boolean;
    provider: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
      tls?: any;
    };
    from?: {
      name: string;
      address: string;
    };
    testMode?: boolean;
  };
  websocket: {
    enabled: boolean;
    port: number;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
    heartbeatInterval: number;
    maxConnections: number;
    enableCompression?: boolean;
    perMessageDeflate?: any;
  };
  [key: string]: any; // 환경별 추가 설정을 위한 인덱스 시그니처
}

/**
 * 현재 환경을 결정합니다
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV?.toLowerCase() as Environment;

  // 유효한 환경인지 확인
  const validEnvironments: Environment[] = [
    'development',
    'staging',
    'production',
    'test',
  ];

  if (validEnvironments.includes(env)) {
    return env;
  }

  // 기본값은 development
  console.warn(
    `⚠️ 알 수 없는 NODE_ENV: ${process.env.NODE_ENV}. development로 설정합니다.`,
  );
  return 'development';
}

/**
 * 환경별 설정을 로드합니다
 */
export function loadConfig(): AppConfig {
  const environment = getCurrentEnvironment();

  console.log(`🔧 환경 설정 로드: ${environment}`);

  let config: AppConfig;

  switch (environment) {
    case 'production':
      config = productionConfig as AppConfig;
      break;
    case 'staging':
      config = stagingConfig as AppConfig;
      break;
    case 'test':
      // 테스트 환경은 개발 환경 기반으로 일부 수정
      config = {
        ...developmentConfig,
        database: {
          ...developmentConfig.database,
          database: 'chatbot_test',
          synchronize: true,
          logging: false,
          dropSchema: true, // 테스트 시마다 스키마 재생성
        },
        logging: {
          ...developmentConfig.logging,
          level: 'error', // 테스트 시에는 에러만 로깅
          enableConsole: false,
          enableFile: false,
        },
        email: {
          ...developmentConfig.email,
          enabled: false,
        },
        websocket: {
          ...developmentConfig.websocket,
          enabled: false, // 테스트 시에는 WebSocket 비활성화
        },
      } as AppConfig;
      break;
    case 'development':
    default:
      config = developmentConfig as AppConfig;
      break;
  }

  // 필수 환경 변수 검증
  validateRequiredEnvVars(config, environment);

  // 설정 검증
  validateConfig(config, environment);

  return config;
}

/**
 * 필수 환경 변수 검증
 */
function validateRequiredEnvVars(config: AppConfig, environment: Environment) {
  const requiredVars: Record<Environment, string[]> = {
    development: [
      // 개발 환경에서는 기본값 사용 가능
    ],
    staging: ['JWT_SECRET', 'DB_PASSWORD', 'OPENAI_API_KEY'],
    production: [
      'JWT_SECRET',
      'DB_HOST',
      'DB_USERNAME',
      'DB_PASSWORD',
      'DB_NAME',
      'OPENAI_API_KEY',
      'ALLOWED_ORIGINS',
    ],
    test: [
      // 테스트 환경에서는 기본값 사용
    ],
  };

  const missing = requiredVars[environment].filter(
    (varName) => !process.env[varName],
  );

  if (missing.length > 0) {
    throw new Error(
      `❌ 필수 환경 변수가 설정되지 않았습니다 (${environment}): ${missing.join(', ')}`,
    );
  }
}

/**
 * 설정 유효성 검증
 */
function validateConfig(config: AppConfig, environment: Environment) {
  const errors: string[] = [];

  // JWT 시크릿 검증
  if (!config.jwt.secret) {
    errors.push('JWT secret이 설정되지 않았습니다.');
  } else if (environment === 'production' && config.jwt.secret.length < 32) {
    errors.push(
      '프로덕션 환경에서는 JWT secret이 최소 32자 이상이어야 합니다.',
    );
  }

  // 데이터베이스 설정 검증
  if (environment === 'production' && config.database.synchronize) {
    errors.push('프로덕션 환경에서는 database.synchronize가 false여야 합니다.');
  }

  // 포트 검증
  if (config.server.port < 1 || config.server.port > 65535) {
    errors.push('서버 포트는 1-65535 범위여야 합니다.');
  }

  // OpenAI API 키 검증
  if (!config.ai.openai.apiKey) {
    errors.push('OpenAI API 키가 설정되지 않았습니다.');
  }

  // CORS 설정 검증
  if (
    environment === 'production' &&
    (Array.isArray(config.server.cors.origin)
      ? config.server.cors.origin.length === 0
      : !config.server.cors.origin)
  ) {
    errors.push('프로덕션 환경에서는 CORS origin이 설정되어야 합니다.');
  }

  // 파일 업로드 크기 검증
  if (config.upload.maxFileSize > 500 * 1024 * 1024) {
    // 500MB
    errors.push('파일 업로드 최대 크기는 500MB를 초과할 수 없습니다.');
  }

  if (errors.length > 0) {
    throw new Error(
      `❌ 설정 검증 실패:\n${errors.map((e) => `  - ${e}`).join('\n')}`,
    );
  }

  console.log(`✅ 설정 검증 완료: ${environment}`);
}

/**
 * 설정 정보 출력 (민감한 정보 제외)
 */
export function printConfigSummary(config: AppConfig) {
  const environment = getCurrentEnvironment();

  console.log(`
🚀 AI Chatbot 서버 시작
📍 환경: ${environment.toUpperCase()}
🌐 서버: ${config.server.host}:${config.server.port}
🗄️  데이터베이스: ${config.database.host}:${config.database.port}/${config.database.database}
🤖 AI 모델: ${config.ai.openai.model}
📁 업로드 경로: ${config.upload.uploadPath}
🔄 캐시: ${config.cache.enableRedis ? 'Redis' : 'Memory'}
📊 모니터링: ${config.monitoring.enabled ? '활성화' : '비활성화'}
🔌 WebSocket: ${config.websocket.enabled ? `포트 ${config.websocket.port}` : '비활성화'}
  `);
}

/**
 * 런타임에 설정 업데이트 (일부 설정만 가능)
 */
export function updateRuntimeConfig(updates: Partial<AppConfig>) {
  // 런타임에 안전하게 업데이트 가능한 설정들만 허용
  const allowedUpdates = [
    'monitoring.alertThresholds',
    'ai.rateLimit',
    'cache.ttl',
    'logging.level',
  ];

  // 실제 구현에서는 현재 설정을 업데이트하고 관련 서비스들에 알림
  console.log('🔄 런타임 설정 업데이트:', updates);
}

// 기본 내보내기
export default loadConfig;
