import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";
import { error as toastError } from "./toast";
import {
  AppError,
  ErrorCategory,
  ErrorSeverity,
  ErrorHandlingOptions,
  HttpError,
  NetworkError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  ApiError,
  UiError,
  SystemError,
  ErrorReportingService,
} from "../types/error";

// 기본 에러 핸들링 옵션
const DEFAULT_ERROR_OPTIONS: ErrorHandlingOptions = {
  showToast: true,
  showModal: false,
  showInline: false,
  autoHide: true,
  hideAfter: 5000,
  reportToService: true,
  logToConsole: true,
};

// 에러 보고 서비스 (나중에 실제 서비스로 교체 가능)
class ConsoleErrorReportingService implements ErrorReportingService {
  async report(error: AppError): Promise<void> {
    if (error.severity === ErrorSeverity.CRITICAL) {
      logger.error("Critical error reported", {
        id: error.id,
        message: error.message,
        category: error.category,
        context: error.context,
      });
    }
  }

  isEnabled(): boolean {
    return process.env.NODE_ENV === "development";
  }
}

// 에러 핸들러 클래스
class ErrorHandler {
  private reportingService: ErrorReportingService;
  private errorListeners: Array<(error: AppError) => void> = [];

  constructor() {
    this.reportingService = new ConsoleErrorReportingService();
    this.setupGlobalErrorHandling();
  }

  // 전역 에러 핸들링 설정
  private setupGlobalErrorHandling(): void {
    // 브라우저 환경에서만 실행
    if (typeof window !== "undefined") {
      // 처리되지 않은 Promise 거부 처리
      window.addEventListener("unhandledrejection", (event) => {
        const error = this.createSystemError(
          "Unhandled Promise Rejection",
          event.reason
        );
        this.handleError(error, { showToast: true });
        event.preventDefault();
      });

      // 일반 JavaScript 에러 처리
      window.addEventListener("error", (event) => {
        const error = this.createSystemError(
          "Unhandled JavaScript Error",
          event.error
        );
        this.handleError(error, { showToast: true });
      });
    }
  }

  // 에러 리스너 추가
  addErrorListener(listener: (error: AppError) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  // 에러 리스너들에게 알림
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        logger.error("Error in error listener", e);
      }
    });
  }

  // HTTP 에러 생성
  createHttpError(
    message: string,
    status: number,
    statusText: string,
    options?: Partial<HttpError>
  ): HttpError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.API,
      severity: this.getSeverityFromStatus(status),
      timestamp: new Date(),
      status,
      statusText,
      userMessage: this.getUserMessageFromStatus(status),
      actionable: status >= 400 && status < 500,
      retryable: status >= 500,
      ...options,
    };
  }

  // 네트워크 에러 생성
  createNetworkError(
    message: string,
    options?: Partial<NetworkError>
  ): NetworkError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      userMessage: "네트워크 연결을 확인해주세요.",
      actionable: true,
      retryable: true,
      ...options,
    };
  }

  // 인증 에러 생성
  createAuthenticationError(
    message: string,
    options?: Partial<AuthenticationError>
  ): AuthenticationError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date(),
      userMessage: "다시 로그인해주세요.",
      actionable: true,
      retryable: false,
      ...options,
    };
  }

  // 권한 에러 생성
  createAuthorizationError(
    message: string,
    options?: Partial<AuthorizationError>
  ): AuthorizationError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      userMessage: "이 작업을 수행할 권한이 없습니다.",
      actionable: false,
      retryable: false,
      ...options,
    };
  }

  // 유효성 검사 에러 생성
  createValidationError(
    message: string,
    field?: string,
    options?: Partial<ValidationError>
  ): ValidationError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      timestamp: new Date(),
      field,
      userMessage: "입력한 정보를 다시 확인해주세요.",
      actionable: true,
      retryable: true,
      ...options,
    };
  }

  // API 에러 생성
  createApiError(
    message: string,
    endpoint?: string,
    options?: Partial<ApiError>
  ): ApiError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.API,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      endpoint,
      userMessage: "서버와의 통신 중 오류가 발생했습니다.",
      actionable: true,
      retryable: true,
      ...options,
    };
  }

  // UI 에러 생성
  createUiError(
    message: string,
    component?: string,
    options?: Partial<UiError>
  ): UiError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.UI,
      severity: ErrorSeverity.LOW,
      timestamp: new Date(),
      component,
      userMessage: "화면 오류가 발생했습니다. 새로고침을 시도해주세요.",
      actionable: true,
      retryable: true,
      ...options,
    };
  }

  // 시스템 에러 생성
  createSystemError(
    message: string,
    originalError?: unknown,
    options?: Partial<SystemError>
  ): SystemError {
    return {
      id: uuidv4(),
      message,
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.CRITICAL,
      timestamp: new Date(),
      stackTrace:
        originalError instanceof Error ? originalError.stack : undefined,
      userMessage: "시스템 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      actionable: true,
      retryable: true,
      context: { originalError: String(originalError) },
      ...options,
    };
  }

  // 일반 에러에서 AppError 생성
  createFromError(error: unknown, category?: ErrorCategory): AppError {
    if (error instanceof Error) {
      return this.createSystemError(error.message, error, {
        stackTrace: error.stack,
      });
    }

    return this.createSystemError("Unknown error occurred", error);
  }

  // 메인 에러 처리 메서드
  async handleError(
    error: AppError | unknown,
    options?: Partial<ErrorHandlingOptions>
  ): Promise<void> {
    // AppError가 아닌 경우 변환
    const appError =
      error instanceof Error || typeof error === "object"
        ? (error as AppError).id
          ? (error as AppError)
          : this.createFromError(error)
        : this.createSystemError(String(error));

    const finalOptions = { ...DEFAULT_ERROR_OPTIONS, ...options };

    // 로깅
    if (finalOptions.logToConsole) {
      this.logError(appError);
    }

    // 외부 서비스에 보고
    if (finalOptions.reportToService && this.reportingService.isEnabled()) {
      try {
        await this.reportingService.report(appError);
      } catch (e) {
        logger.error("Failed to report error to service", e);
      }
    }

    // UI에 표시
    this.displayError(appError, finalOptions);

    // 리스너들에게 알림
    this.notifyListeners(appError);
  }

  // 에러 로깅
  private logError(error: AppError): void {
    const logData = {
      id: error.id,
      category: error.category,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: error.timestamp,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error("Critical Error", logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error("High Severity Error", logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn("Medium Severity Error", logData);
        break;
      case ErrorSeverity.LOW:
        logger.info("Low Severity Error", logData);
        break;
    }
  }

  // 에러 표시
  private displayError(error: AppError, options: ErrorHandlingOptions): void {
    const message = error.userMessage || error.message;

    if (options.showToast) {
      if (
        error.severity === ErrorSeverity.CRITICAL ||
        error.severity === ErrorSeverity.HIGH
      ) {
        toastError(message);
      } else {
        toastError(message);
      }
    }

    // TODO: 모달 및 인라인 표시는 컴포넌트 생성 후 구현
  }

  // HTTP 상태 코드에서 심각도 결정
  private getSeverityFromStatus(status: number): ErrorSeverity {
    if (status >= 500) return ErrorSeverity.HIGH;
    if (status >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  // HTTP 상태 코드에서 사용자 메시지 생성
  private getUserMessageFromStatus(status: number): string {
    switch (status) {
      case 400:
        return "잘못된 요청입니다. 입력 정보를 확인해주세요.";
      case 401:
        return "인증이 필요합니다. 다시 로그인해주세요.";
      case 403:
        return "접근 권한이 없습니다.";
      case 404:
        return "요청한 리소스를 찾을 수 없습니다.";
      case 429:
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      case 500:
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      case 502:
      case 503:
      case 504:
        return "서버가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
      default:
        return "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
  }

  // 재시도 가능한 에러인지 확인
  isRetryable(error: AppError): boolean {
    return error.retryable === true;
  }

  // 사용자 조치 가능한 에러인지 확인
  isActionable(error: AppError): boolean {
    return error.actionable === true;
  }
}

// 싱글톤 인스턴스 생성
export const errorHandler = new ErrorHandler();
export default errorHandler;
