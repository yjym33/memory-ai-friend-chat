import axiosInstance from "../utils/axios";
import { error as toastError } from "../lib/toast";

/**
 * API 에러 타입 정의
 */
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
 * 에러 메시지 추출
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
 * 특정 HTTP 상태 코드에 따른 에러 처리
 */
const handleSpecificErrors = (
  statusCode: number | undefined,
  message: string
): void => {
  switch (statusCode) {
    case 401:
      toastError("인증이 필요합니다. 다시 로그인해주세요.");
      break;
    case 403:
      toastError("접근 권한이 없습니다.");
      break;
    case 404:
      toastError("요청한 리소스를 찾을 수 없습니다.");
      break;
    case 422:
      toastError("입력 데이터가 올바르지 않습니다.");
      break;
    case 429:
      toastError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
      break;
    case 500:
      toastError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      break;
    default:
      if (statusCode && statusCode >= 400) {
        toastError(message || `오류가 발생했습니다. (${statusCode})`);
      }
  }
};

/**
 * API 클라이언트 - 모든 HTTP 요청을 처리하는 중앙집중식 클라이언트
 */
export const apiClient = {
  /**
   * 기본 요청 메서드
   */
  async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await axiosInstance.request({
        method,
        url,
        data,
        ...config,
      });
      return response.data;
    } catch (error: unknown) {
      // 에러 로깅
      console.error(`API 요청 실패 [${method} ${url}]:`, error);

      // 상세한 에러 정보 추출
      const errorMessage = extractErrorMessage(error);
      const apiError = error as ApiError;
      const statusCode = apiError.response?.status;

      // 특정 상태 코드에 따른 처리
      handleSpecificErrors(statusCode, errorMessage);

      // 에러 재던지기 (호출하는 곳에서 추가 처리 가능)
      throw error;
    }
  },

  /**
   * GET 요청
   */
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    return this.request<T>("GET", url, undefined, config);
  },

  /**
   * POST 요청
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("POST", url, data, config);
  },

  /**
   * PUT 요청
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("PUT", url, data, config);
  },

  /**
   * PATCH 요청
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("PATCH", url, data, config);
  },

  /**
   * DELETE 요청
   */
  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    return this.request<T>("DELETE", url, undefined, config);
  },
};

export default apiClient;
