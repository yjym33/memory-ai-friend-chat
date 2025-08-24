import axiosInstance from "../utils/axios";
import { error as toastError } from "../lib/toast";

/**
 * 기본 서비스 클래스
 * 모든 API 서비스가 상속받아 사용할 수 있는 공통 기능 제공
 */
export abstract class BaseService {
  /**
   * API 요청 래퍼 - 공통 에러 처리 포함
   */
  protected static async request<T>(
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
      const errorMessage = this.extractErrorMessage(error);
      const apiError = error as { response?: { status?: number } };
      const statusCode = apiError.response?.status;

      // 특정 상태 코드에 따른 처리
      this.handleSpecificErrors(statusCode, errorMessage);

      // 에러 재던지기 (호출하는 곳에서 추가 처리 가능)
      throw error;
    }
  }

  /**
   * GET 요청
   */
  protected static async get<T>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("GET", url, undefined, config);
  }

  /**
   * POST 요청
   */
  protected static async post<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("POST", url, data, config);
  }

  /**
   * PUT 요청
   */
  protected static async put<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("PUT", url, data, config);
  }

  /**
   * PATCH 요청
   */
  protected static async patch<T>(
    url: string,
    data?: unknown,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("PATCH", url, data, config);
  }

  /**
   * DELETE 요청
   */
  protected static async delete<T>(
    url: string,
    config?: Record<string, unknown>
  ): Promise<T> {
    return this.request<T>("DELETE", url, undefined, config);
  }

  /**
   * 에러 메시지 추출
   */
  private static extractErrorMessage(error: unknown): string {
    const apiError = error as {
      response?: {
        data?: {
          message?: string;
          error?: string;
        };
      };
      message?: string;
    };

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
  }

  /**
   * 특정 HTTP 상태 코드에 따른 에러 처리
   */
  private static handleSpecificErrors(
    statusCode: number | undefined,
    message: string
  ): void {
    switch (statusCode) {
      case 401:
        toastError("인증이 필요합니다. 다시 로그인해주세요.");
        // 필요시 로그아웃 처리 또는 로그인 페이지로 리다이렉트
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
  }
}

/**
 * API 요청 상태를 관리하는 유틸리티
 */
export class ApiState {
  private static loadingStates = new Map<string, boolean>();

  static setLoading(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading);
  }

  static isLoading(key: string): boolean {
    return this.loadingStates.get(key) ?? false;
  }

  static clearLoading(key: string): void {
    this.loadingStates.delete(key);
  }
}
