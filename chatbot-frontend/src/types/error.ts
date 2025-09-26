// 에러 심각도 레벨
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// 에러 카테고리
export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  API = "api",
  UI = "ui",
  SYSTEM = "system",
  UNKNOWN = "unknown",
}

// 기본 에러 인터페이스
export interface BaseError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: Date;
  context?: Record<string, unknown>;
  stackTrace?: string;
  userMessage?: string; // 사용자에게 표시할 메시지
  actionable?: boolean; // 사용자가 조치를 취할 수 있는지
  retryable?: boolean; // 재시도 가능한지
}

// HTTP 에러 인터페이스
export interface HttpError extends BaseError {
  status: number;
  statusText: string;
  url?: string;
  method?: string;
  requestId?: string;
}

// 네트워크 에러
export interface NetworkError extends BaseError {
  category: ErrorCategory.NETWORK;
  isOnline: boolean;
  connectionType?: string;
}

// 인증 에러
export interface AuthenticationError extends BaseError {
  category: ErrorCategory.AUTHENTICATION;
  isTokenExpired?: boolean;
  redirectUrl?: string;
}

// 권한 에러
export interface AuthorizationError extends BaseError {
  category: ErrorCategory.AUTHORIZATION;
  requiredRole?: string;
  currentRole?: string;
}

// 유효성 검사 에러
export interface ValidationError extends BaseError {
  category: ErrorCategory.VALIDATION;
  field?: string;
  value?: unknown;
  constraints?: string[];
}

// API 에러
export interface ApiError extends BaseError {
  category: ErrorCategory.API;
  endpoint?: string;
  errorCode?: string;
  details?: Record<string, unknown>;
}

// UI 에러
export interface UiError extends BaseError {
  category: ErrorCategory.UI;
  component?: string;
  action?: string;
}

// 시스템 에러
export interface SystemError extends BaseError {
  category: ErrorCategory.SYSTEM;
  subsystem?: string;
  errorCode?: string;
}

// 에러 유니온 타입
export type AppError =
  | HttpError
  | NetworkError
  | AuthenticationError
  | AuthorizationError
  | ValidationError
  | ApiError
  | UiError
  | SystemError;

// 에러 액션 타입
export interface ErrorAction {
  label: string;
  action: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
}

// 에러 처리 옵션
export interface ErrorHandlingOptions {
  showToast?: boolean;
  showModal?: boolean;
  showInline?: boolean;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  actions?: ErrorAction[];
  reportToService?: boolean;
  logToConsole?: boolean;
}

// 에러 보고 서비스 인터페이스
export interface ErrorReportingService {
  report(error: AppError): Promise<void>;
  isEnabled(): boolean;
}
