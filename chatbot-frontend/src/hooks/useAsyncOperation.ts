import { useState, useCallback } from "react";
import { error as toastError } from "../lib/toast";

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

/**
 * 에러 메시지 추출 유틸리티
 */
const extractErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;

  if (apiError.response?.data?.message) {
    return apiError.response.data.message;
  }
  if (apiError.response?.data?.error) {
    return apiError.response.data.error;
  }
  if (apiError.message) {
    return apiError.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

/**
 * 비동기 작업을 위한 공통 훅
 * 로딩 상태, 에러 처리, 데이터 관리를 통합적으로 제공합니다.
 */
export function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 비동기 함수를 실행하고 상태를 관리합니다
   * @param asyncFn - 실행할 비동기 함수
   * @param options - 실행 옵션
   * @returns 실행 결과
   */
  const execute = useCallback(
    async (
      asyncFn: () => Promise<T>,
      options?: {
        showErrorToast?: boolean;
        onSuccess?: (data: T) => void;
        onError?: (error: string) => void;
      }
    ): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const result = await asyncFn();
        setData(result);

        // 성공 콜백 실행
        options?.onSuccess?.(result);

        return result;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);

        // 에러 토스트 표시 (기본값: true)
        if (options?.showErrorToast !== false) {
          toastError(errorMessage);
        }

        // 에러 콜백 실행
        options?.onError?.(errorMessage);

        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * 상태를 초기화합니다
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  /**
   * 에러만 초기화합니다
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    clearError,
    // 편의성을 위한 상태 플래그들
    isIdle: !loading && !error && !data,
    isSuccess: !loading && !error && !!data,
    isError: !loading && !!error,
  };
}

/**
 * 간단한 비동기 작업을 위한 경량 훅
 * 데이터 저장 없이 로딩과 에러만 관리합니다.
 */
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (
      asyncFn: () => Promise<void>,
      options?: {
        showErrorToast?: boolean;
        onSuccess?: () => void;
        onError?: (error: string) => void;
      }
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await asyncFn();

        // 성공 콜백 실행
        options?.onSuccess?.();

        return true;
      } catch (err) {
        const errorMessage = extractErrorMessage(err);
        setError(errorMessage);

        // 에러 토스트 표시 (기본값: true)
        if (options?.showErrorToast !== false) {
          toastError(errorMessage);
        }

        // 에러 콜백 실행
        options?.onError?.(errorMessage);

        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset,
    clearError,
    isIdle: !loading && !error,
    isError: !loading && !!error,
  };
}
