import { useCallback, useEffect, useState } from "react";
import { errorHandler } from "../lib/errorHandler";
import {
  AppError,
  ErrorHandlingOptions,
  ErrorCategory,
  ErrorSeverity,
} from "../types/error";

// 에러 상태 관리 인터페이스
interface ErrorState {
  errors: AppError[];
  hasErrors: boolean;
  latestError: AppError | null;
}

// useErrorHandler 훅
export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    errors: [],
    hasErrors: false,
    latestError: null,
  });

  // 에러 추가
  const addError = useCallback((error: AppError) => {
    setErrorState((prev) => ({
      errors: [...prev.errors, error],
      hasErrors: true,
      latestError: error,
    }));
  }, []);

  // 에러 제거
  const removeError = useCallback((errorId: string) => {
    setErrorState((prev) => {
      const newErrors = prev.errors.filter((e) => e.id !== errorId);
      return {
        errors: newErrors,
        hasErrors: newErrors.length > 0,
        latestError:
          newErrors.length > 0 ? newErrors[newErrors.length - 1] : null,
      };
    });
  }, []);

  // 모든 에러 제거
  const clearErrors = useCallback(() => {
    setErrorState({
      errors: [],
      hasErrors: false,
      latestError: null,
    });
  }, []);

  // 에러 핸들러 등록
  useEffect(() => {
    const unsubscribe = errorHandler.addErrorListener(addError);
    return unsubscribe;
  }, [addError]);

  // 에러 처리 메서드들
  const handleError = useCallback(
    async (
      error: AppError | unknown,
      options?: Partial<ErrorHandlingOptions>
    ) => {
      await errorHandler.handleError(error, options);
    },
    []
  );

  const createHttpError = useCallback(
    (message: string, status: number, statusText: string) => {
      return errorHandler.createHttpError(message, status, statusText);
    },
    []
  );

  const createNetworkError = useCallback((message: string) => {
    return errorHandler.createNetworkError(message);
  }, []);

  const createAuthenticationError = useCallback((message: string) => {
    return errorHandler.createAuthenticationError(message);
  }, []);

  const createAuthorizationError = useCallback((message: string) => {
    return errorHandler.createAuthorizationError(message);
  }, []);

  const createValidationError = useCallback(
    (message: string, field?: string) => {
      return errorHandler.createValidationError(message, field);
    },
    []
  );

  const createApiError = useCallback((message: string, endpoint?: string) => {
    return errorHandler.createApiError(message, endpoint);
  }, []);

  const createUiError = useCallback((message: string, component?: string) => {
    return errorHandler.createUiError(message, component);
  }, []);

  const createSystemError = useCallback(
    (message: string, originalError?: unknown) => {
      return errorHandler.createSystemError(message, originalError);
    },
    []
  );

  // 유틸리티 메서드들
  const isRetryable = useCallback((error: AppError) => {
    return errorHandler.isRetryable(error);
  }, []);

  const isActionable = useCallback((error: AppError) => {
    return errorHandler.isActionable(error);
  }, []);

  // 심각도별 에러 필터링
  const getErrorsBySeverity = useCallback(
    (severity: ErrorSeverity) => {
      return errorState.errors.filter((error) => error.severity === severity);
    },
    [errorState.errors]
  );

  // 카테고리별 에러 필터링
  const getErrorsByCategory = useCallback(
    (category: ErrorCategory) => {
      return errorState.errors.filter((error) => error.category === category);
    },
    [errorState.errors]
  );

  return {
    // 상태
    ...errorState,

    // 에러 관리
    removeError,
    clearErrors,

    // 에러 처리
    handleError,

    // 에러 생성
    createHttpError,
    createNetworkError,
    createAuthenticationError,
    createAuthorizationError,
    createValidationError,
    createApiError,
    createUiError,
    createSystemError,

    // 유틸리티
    isRetryable,
    isActionable,
    getErrorsBySeverity,
    getErrorsByCategory,
  };
}

// API 호출을 위한 에러 핸들링 훅
export function useApiErrorHandler() {
  const { handleError, createHttpError, createNetworkError, createApiError } =
    useErrorHandler();

  const handleApiError = useCallback(
    async (error: unknown, endpoint?: string) => {
      // Axios 에러 처리
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { 
          response?: { status: number, statusText: string };
          message?: string;
          request?: unknown;
        };

        if (axiosError.response) {
          // 서버 응답이 있는 경우
          const httpError = createHttpError(
            axiosError.message || "API 요청 실패",
            axiosError.response.status,
            axiosError.response.statusText
          );
          await handleError(httpError);
        } else if (axiosError.request) {
          // 네트워크 에러
          const networkError =
            createNetworkError("네트워크 연결을 확인해주세요.");
          await handleError(networkError);
        } else {
          // 기타 API 에러
          const apiError = createApiError(
            axiosError.message || "API 요청 설정 오류",
            endpoint
          );
          await handleError(apiError);
        }
      } else {
        // 일반 에러
        const apiError = createApiError(
          error instanceof Error ? error.message : "알 수 없는 API 오류",
          endpoint
        );
        await handleError(apiError);
      }
    },
    [handleError, createHttpError, createNetworkError, createApiError]
  );

  return {
    handleApiError,
  };
}

// 폼 유효성 검사를 위한 에러 핸들링 훅
export function useFormErrorHandler() {
  const { createValidationError } = useErrorHandler();
  const [fieldErrors, setFieldErrors] = useState<Record<string, AppError>>({});

  const setFieldError = useCallback(
    (field: string, message: string) => {
      const error = createValidationError(message, field);
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
    },
    [createValidationError]
  );

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  const hasFieldError = useCallback(
    (field: string) => {
      return field in fieldErrors;
    },
    [fieldErrors]
  );

  const getFieldError = useCallback(
    (field: string) => {
      return fieldErrors[field];
    },
    [fieldErrors]
  );

  return {
    fieldErrors,
    setFieldError,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldError,
    getFieldError,
  };
}
