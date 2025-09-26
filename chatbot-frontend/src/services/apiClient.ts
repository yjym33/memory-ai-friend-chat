import axiosInstance from "../utils/axios";
import { errorHandler } from "../lib/errorHandler";
import { logger } from "../lib/logger";

/**
 * API 클라이언트 - 모든 HTTP 요청을 처리하는 중앙집중식 클라이언트
 * 새로운 에러 핸들링 시스템을 사용합니다.
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
      // 새로운 에러 핸들링 시스템 사용
      let appError;

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as any;

        if (axiosError.response) {
          // HTTP 에러 응답
          appError = errorHandler.createHttpError(
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
        } else if (axiosError.request) {
          // 네트워크 에러
          appError = errorHandler.createNetworkError(
            "네트워크 연결을 확인해주세요.",
            {
              context: {
                url: axiosError.config?.url,
                method: axiosError.config?.method,
              },
            }
          );
        } else {
          // 요청 설정 에러
          appError = errorHandler.createApiError(
            axiosError.message || "API 요청 설정 오류",
            axiosError.config?.url
          );
        }
      } else {
        // 일반 에러
        appError = errorHandler.createSystemError(
          error instanceof Error ? error.message : "알 수 없는 오류",
          error
        );
      }

      // 에러 처리 (토스트는 표시하지 않고 에러 리스너들에게만 알림)
      await errorHandler.handleError(appError, {
        showToast: false, // 호출하는 곳에서 결정하도록
        reportToService: true,
        logToConsole: true,
      });

      // 에러 재던지기 (호출하는 곳에서 추가 처리 가능)
      throw appError;
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
