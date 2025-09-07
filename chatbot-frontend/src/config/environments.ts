export type Environment = "development" | "staging" | "production" | "test";

export interface AppConfig {
  // API 설정
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };

  // WebSocket 설정
  websocket: {
    enabled: boolean;
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };

  // 인증 설정
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    tokenExpiryBuffer: number; // 토큰 만료 전 갱신 시점 (분)
  };

  // 파일 업로드 설정
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    chunkSize: number;
    maxConcurrentUploads: number;
  };

  // UI 설정
  ui: {
    theme: "light" | "dark" | "auto";
    language: string;
    dateFormat: string;
    timeFormat: string;
    pageSize: number;
    animationDuration: number;
  };

  // 성능 설정
  performance: {
    enableVirtualization: boolean;
    debounceDelay: number;
    throttleDelay: number;
    cacheSize: number;
    prefetchPages: number;
  };

  // 모니터링 설정
  monitoring: {
    enabled: boolean;
    errorReporting: boolean;
    performanceTracking: boolean;
    userAnalytics: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };

  // 기능 플래그
  features: {
    enableFileUpload: boolean;
    enableVoiceInput: boolean;
    enableDarkMode: boolean;
    enableNotifications: boolean;
    enableOfflineMode: boolean;
    enableExperimentalFeatures: boolean;
  };

  // 외부 서비스
  external: {
    sentry?: {
      dsn: string;
      environment: string;
      tracesSampleRate: number;
    };
    analytics?: {
      trackingId: string;
      enabled: boolean;
    };
  };
}

// 개발 환경 설정
const developmentConfig: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  websocket: {
    enabled: true,
    url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8081",
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },

  auth: {
    tokenKey: "chatbot_token",
    refreshTokenKey: "chatbot_refresh_token",
    tokenExpiryBuffer: 5,
  },

  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
    ],
    chunkSize: 1024 * 1024, // 1MB
    maxConcurrentUploads: 3,
  },

  ui: {
    theme: "auto",
    language: "ko",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm:ss",
    pageSize: 20,
    animationDuration: 300,
  },

  performance: {
    enableVirtualization: false, // 개발 환경에서는 디버깅 편의를 위해 비활성화
    debounceDelay: 300,
    throttleDelay: 100,
    cacheSize: 100,
    prefetchPages: 1,
  },

  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceTracking: true,
    userAnalytics: false, // 개발 환경에서는 비활성화
    logLevel: "debug",
  },

  features: {
    enableFileUpload: true,
    enableVoiceInput: false, // 개발 중
    enableDarkMode: true,
    enableNotifications: true,
    enableOfflineMode: false, // 개발 중
    enableExperimentalFeatures: true,
  },

  external: {
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? {
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: "development",
          tracesSampleRate: 1.0,
        }
      : undefined,
    analytics: process.env.NEXT_PUBLIC_GA_ID
      ? {
          trackingId: process.env.NEXT_PUBLIC_GA_ID,
          enabled: false, // 개발 환경에서는 비활성화
        }
      : undefined,
  },
};

// 스테이징 환경 설정
const stagingConfig: AppConfig = {
  api: {
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL || "https://api-staging.chatbot.com",
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },

  websocket: {
    enabled: true,
    url: process.env.NEXT_PUBLIC_WS_URL || "wss://ws-staging.chatbot.com",
    reconnectInterval: 2000,
    maxReconnectAttempts: 15,
    heartbeatInterval: 25000,
  },

  auth: {
    tokenKey: "chatbot_token_staging",
    refreshTokenKey: "chatbot_refresh_token_staging",
    tokenExpiryBuffer: 5,
  },

  upload: {
    maxFileSize: 75 * 1024 * 1024, // 75MB
    allowedTypes: [
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
    ],
    chunkSize: 1024 * 1024, // 1MB
    maxConcurrentUploads: 2,
  },

  ui: {
    theme: "auto",
    language: "ko",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm:ss",
    pageSize: 20,
    animationDuration: 250,
  },

  performance: {
    enableVirtualization: true,
    debounceDelay: 300,
    throttleDelay: 100,
    cacheSize: 200,
    prefetchPages: 2,
  },

  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceTracking: true,
    userAnalytics: true,
    logLevel: "info",
  },

  features: {
    enableFileUpload: true,
    enableVoiceInput: true, // 스테이징에서 테스트
    enableDarkMode: true,
    enableNotifications: true,
    enableOfflineMode: true, // 스테이징에서 테스트
    enableExperimentalFeatures: true,
  },

  external: {
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? {
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: "staging",
          tracesSampleRate: 0.5,
        }
      : undefined,
    analytics: process.env.NEXT_PUBLIC_GA_ID
      ? {
          trackingId: process.env.NEXT_PUBLIC_GA_ID,
          enabled: true,
        }
      : undefined,
  },
};

// 프로덕션 환경 설정
const productionConfig: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://api.chatbot.com",
    timeout: 20000, // 프로덕션에서는 더 짧게
    retryAttempts: 2,
    retryDelay: 2000,
  },

  websocket: {
    enabled: true,
    url: process.env.NEXT_PUBLIC_WS_URL || "wss://ws.chatbot.com",
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 25000,
  },

  auth: {
    tokenKey: "chatbot_token",
    refreshTokenKey: "chatbot_refresh_token",
    tokenExpiryBuffer: 10, // 프로덕션에서는 더 여유있게
  },

  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".jpg",
      ".jpeg",
      ".png",
    ],
    chunkSize: 512 * 1024, // 512KB
    maxConcurrentUploads: 1,
  },

  ui: {
    theme: "auto",
    language: "ko",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    pageSize: 15,
    animationDuration: 200,
  },

  performance: {
    enableVirtualization: true,
    debounceDelay: 500, // 프로덕션에서는 더 보수적으로
    throttleDelay: 200,
    cacheSize: 500,
    prefetchPages: 3,
  },

  monitoring: {
    enabled: true,
    errorReporting: true,
    performanceTracking: true,
    userAnalytics: true,
    logLevel: "warn",
  },

  features: {
    enableFileUpload: true,
    enableVoiceInput: false, // 프로덕션에서는 안정화 후 활성화
    enableDarkMode: true,
    enableNotifications: true,
    enableOfflineMode: false, // 프로덕션에서는 안정화 후 활성화
    enableExperimentalFeatures: false,
  },

  external: {
    sentry: process.env.NEXT_PUBLIC_SENTRY_DSN
      ? {
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: "production",
          tracesSampleRate: 0.1,
        }
      : undefined,
    analytics: process.env.NEXT_PUBLIC_GA_ID
      ? {
          trackingId: process.env.NEXT_PUBLIC_GA_ID,
          enabled: true,
        }
      : undefined,
  },
};

// 테스트 환경 설정
const testConfig: AppConfig = {
  ...developmentConfig,
  api: {
    ...developmentConfig.api,
    baseUrl: "http://localhost:8080",
    timeout: 5000,
    retryAttempts: 1,
    retryDelay: 100,
  },
  websocket: {
    ...developmentConfig.websocket,
    enabled: false, // 테스트에서는 WebSocket 비활성화
  },
  monitoring: {
    ...developmentConfig.monitoring,
    enabled: false,
    errorReporting: false,
    performanceTracking: false,
    userAnalytics: false,
    logLevel: "error",
  },
  features: {
    ...developmentConfig.features,
    enableExperimentalFeatures: false,
  },
  external: {}, // 테스트에서는 외부 서비스 비활성화
};

/**
 * 현재 환경을 결정합니다
 */
export function getCurrentEnvironment(): Environment {
  if (typeof window === "undefined") {
    // 서버 사이드에서는 NODE_ENV 사용
    return (process.env.NODE_ENV as Environment) || "development";
  }

  // 클라이언트 사이드에서는 NEXT_PUBLIC_ENV 사용
  const env = process.env.NEXT_PUBLIC_ENV as Environment;

  // URL 기반 환경 감지 (fallback)
  if (!env) {
    const hostname = window.location.hostname;
    if (hostname.includes("staging")) return "staging";
    if (hostname.includes("localhost") || hostname.includes("127.0.0.1"))
      return "development";
    return "production";
  }

  return env || "development";
}

/**
 * 환경별 설정을 로드합니다
 */
export function loadConfig(): AppConfig {
  const environment = getCurrentEnvironment();

  let config: AppConfig;

  switch (environment) {
    case "production":
      config = productionConfig;
      break;
    case "staging":
      config = stagingConfig;
      break;
    case "test":
      config = testConfig;
      break;
    case "development":
    default:
      config = developmentConfig;
      break;
  }

  // 환경 변수로 일부 설정 오버라이드
  if (process.env.NEXT_PUBLIC_API_URL) {
    config.api.baseUrl = process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.NEXT_PUBLIC_WS_URL) {
    config.websocket.url = process.env.NEXT_PUBLIC_WS_URL;
  }

  // 개발 환경에서만 설정 정보 출력
  if (environment === "development" && typeof window !== "undefined") {
    console.log("🔧 프론트엔드 설정:", {
      environment,
      apiUrl: config.api.baseUrl,
      wsUrl: config.websocket.url,
      features: config.features,
    });
  }

  return config;
}

/**
 * 특정 기능이 활성화되어 있는지 확인합니다
 */
export function isFeatureEnabled(
  feature: keyof AppConfig["features"]
): boolean {
  const config = loadConfig();
  return config.features[feature];
}

/**
 * 현재 환경이 개발 환경인지 확인합니다
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === "development";
}

/**
 * 현재 환경이 프로덕션 환경인지 확인합니다
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === "production";
}

/**
 * 디버그 모드인지 확인합니다
 */
export function isDebugMode(): boolean {
  const config = loadConfig();
  return config.monitoring.logLevel === "debug" || isDevelopment();
}

// 기본 내보내기
export default loadConfig;
