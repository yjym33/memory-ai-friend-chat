import { apiClient } from "./apiClient";
import {
  ImageProvider,
  MultiImageResponse,
  AvailableImageProvidersResponse,
} from "../types";

const API_BASE = "/image";

/**
 * Multi-Image Orchestrator 서비스
 * 여러 이미지 생성 AI를 동시에 호출하여 복수의 이미지를 받습니다.
 */
export const multiImageService = {
  /**
   * 사용 가능한 이미지 Provider 목록을 조회합니다.
   */
  getAvailableProviders: async (): Promise<AvailableImageProvidersResponse> => {
    const response = await apiClient.get<AvailableImageProvidersResponse>(
      `${API_BASE}/multi/providers`
    );
    return response;
  },

  /**
   * 여러 이미지 생성 AI를 동시에 호출하여 복수의 이미지를 생성합니다.
   * @param prompt - 이미지 프롬프트
   * @param providers - 사용할 이미지 Provider 목록
   * @param options - 추가 옵션 (negativePrompt, size, quality, style)
   */
  generateMultiImages: async (
    prompt: string,
    providers: ImageProvider[],
    options?: {
      negativePrompt?: string;
      size?: string;
      quality?: string;
      style?: string;
    }
  ): Promise<MultiImageResponse> => {
    const response = await apiClient.post<MultiImageResponse>(
      `${API_BASE}/multi/generate`,
      {
        prompt,
        providers,
        ...options,
      }
    );
    return response;
  },
};

