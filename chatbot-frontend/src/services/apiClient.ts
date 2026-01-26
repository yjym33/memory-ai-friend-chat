/**
 * API 클라이언트
 *
 * 모든 HTTP 요청을 처리하는 중앙집중식 클라이언트
 * 통합 에러 핸들링 시스템을 사용
 *
 * @performance
 * - 조기 반환 패턴으로 에러 케이스 우선 처리 (js-early-exit)
 * - 타입 안전성을 위한 제네릭 메서드 제공
 */
import axiosInstance from "../utils/axios";
import { errorHandler } from "../lib/errorHandler";

/** HTTP 메서드 타입 */
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** 요청 설정 타입 */
type RequestConfig = Record<string, unknown>;

/** Axios 에러 응답 타입 */
interface AxiosErrorResponse {
  response?: {
    status: number;
    statusText: string;
    data?: unknown;
  };
  message?: string;
  config?: {
    url?: string;
    method?: string;
    data?: unknown;
  };
  request?: unknown;
}

/**
 * API 클라이언트 - HTTP 요청 중앙 관리
 *
 * @example
 * // GET 요청
 * const data = await apiClient.get<User[]>('/users');
 *
 * @example
 * // POST 요청
 * const newUser = await apiClient.post<User>('/users', { name: 'John' });
 */
export const apiClient = {
  /**
   * 기본 요청 메서드
   *
   * @template T - 응답 데이터 타입
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param data - 요청 데이터 (선택)
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   * @throws AppError - 요청 실패 시
   */
  async request<T>(
    method: HttpMethod,
    url: string,
    data?: unknown,
    config?: RequestConfig
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
      // 에러 객체 생성
      const appError = this.createAppError(error);

      // 에러 처리 (토스트는 호출자가 결정)
      await errorHandler.handleError(appError, {
        showToast: false,
        reportToService: true,
        logToConsole: true,
      });

      throw appError;
    }
  },

  /**
   * 에러 객체 생성 헬퍼
   *
   * @param error - 원본 에러
   * @returns AppError 인스턴스
   */
  createAppError(error: unknown) {
    // 조기 반환: Axios 에러가 아닌 경우 (js-early-exit)
    if (!error || typeof error !== "object" || !("response" in error)) {
      return errorHandler.createSystemError(
        error instanceof Error ? error.message : "알 수 없는 오류",
        error
      );
    }

    const axiosError = error as AxiosErrorResponse;

    // HTTP 에러 응답
    if (axiosError.response) {
      return errorHandler.createHttpError(
        axiosError.message || "API 요청 실패",
        axiosError.response.status,
        axiosError.response.statusText,
        {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
          context: {
            requestData: axiosError.config?.data,
            responseData: axiosError.response.data,
          },
        }
      );
    }

    // 네트워크 에러
    if (axiosError.request) {
      return errorHandler.createNetworkError("네트워크 연결을 확인해주세요.", {
        context: {
          url: axiosError.config?.url,
          method: axiosError.config?.method,
        },
      });
    }

    // 요청 설정 에러
    return errorHandler.createApiError(
      axiosError.message || "API 요청 설정 오류",
      axiosError.config?.url
    );
  },

  /**
   * GET 요청
   *
   * @template T - 응답 데이터 타입
   * @param url - 요청 URL
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   */
  async get<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("GET", url, undefined, config);
  },

  /**
   * POST 요청
   *
   * @template T - 응답 데이터 타입
   * @param url - 요청 URL
   * @param data - 요청 데이터 (선택)
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   */
  async post<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>("POST", url, data, config);
  },

  /**
   * PUT 요청
   *
   * @template T - 응답 데이터 타입
   * @param url - 요청 URL
   * @param data - 요청 데이터 (선택)
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   */
  async put<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>("PUT", url, data, config);
  },

  /**
   * PATCH 요청
   *
   * @template T - 응답 데이터 타입
   * @param url - 요청 URL
   * @param data - 요청 데이터 (선택)
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   */
  async patch<T>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>("PATCH", url, data, config);
  },

  /**
   * DELETE 요청
   *
   * @template T - 응답 데이터 타입
   * @param url - 요청 URL
   * @param config - 추가 설정 (선택)
   * @returns 응답 데이터
   */
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.request<T>("DELETE", url, undefined, config);
  },
};

export default apiClient;
