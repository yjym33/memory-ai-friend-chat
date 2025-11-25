import apiClient from "./apiClient";
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageProvider,
} from "../types";

/**
 * 이미지 생성 서비스
 * DALL-E, Stability AI 등 이미지 생성 API와 통신합니다.
 */

/**
 * 이미지 생성 API 응답 타입
 */
interface ImageGenerationApiResponse {
  success: boolean;
  data: ImageGenerationResponse;
  message?: string;
}

/**
 * 이미지 생성 요청
 * @param request - 이미지 생성 요청 데이터
 * @returns 생성된 이미지 정보
 */
export const generateImage = async (
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse> => {
  const response = await apiClient.post<ImageGenerationApiResponse>("/image/generate", request);
  return response.data;
};

/**
 * 모델 목록 API 응답 타입
 */
interface ModelsApiResponse {
  success: boolean;
  models: string[];
}

/**
 * 사용 가능한 이미지 모델 목록 조회
 * @param provider - Provider 필터 (옵션)
 * @returns 모델 목록
 */
export const getAvailableModels = async (
  provider?: ImageProvider
): Promise<string[]> => {
  const params = provider ? { provider } : {};
  const response = await apiClient.get<ModelsApiResponse>("/image/models", { params });
  return response.models;
};

/**
 * 크기 목록 API 응답 타입
 */
interface SizesApiResponse {
  success: boolean;
  sizes: string[];
}

/**
 * 지원되는 이미지 크기 목록 조회
 * @param provider - Provider
 * @param model - 모델 (옵션)
 * @returns 크기 목록
 */
export const getSupportedSizes = async (
  provider?: string,
  model?: string
): Promise<string[]> => {
  const params: Record<string, string> = {};
  if (provider) params.provider = provider;
  if (model) params.model = model;

  const response = await apiClient.get<SizesApiResponse>("/image/sizes", { params });
  return response.sizes;
};

/**
 * Provider 목록 API 응답 타입
 */
interface ProvidersApiResponse {
  success: boolean;
  providers: Array<{ id: string; name: string }>;
}

/**
 * 사용 가능한 Provider 목록 조회
 * @returns Provider 목록
 */
export const getAvailableProviders = async (): Promise<
  Array<{ id: string; name: string }>
> => {
  const response = await apiClient.get<ProvidersApiResponse>("/image/providers");
  return response.providers;
};

/**
 * 이미지 생성 요청인지 확인 (클라이언트 측 체크)
 * @param message - 사용자 메시지
 * @returns 이미지 생성 요청 여부
 */
export const isImageGenerationRequest = (message: string): boolean => {
  const imageKeywords = [
    // 한국어 키워드
    "그림 그려",
    "그림그려",
    "이미지 생성",
    "이미지생성",
    "이미지 만들어",
    "이미지만들어",
    "그림 만들어",
    "그림만들어",
    "그려줘",
    "그려 줘",
    "이미지 그려",
    "이미지그려",
    "사진 만들어",
    "사진만들어",
    // 명령어
    "/image",
    "/이미지",
    "/그림",
    "/사진",
    // 영어 키워드
    "draw",
    "generate image",
    "create image",
    "make image",
  ];

  const lowerMessage = message.toLowerCase();
  return imageKeywords.some((keyword) =>
    lowerMessage.includes(keyword.toLowerCase())
  );
};

/**
 * 이미지 프롬프트 추출 (클라이언트 측)
 * @param message - 사용자 메시지
 * @returns 추출된 프롬프트
 */
export const extractImagePrompt = (message: string): string => {
  let cleanedMessage = message
    .replace(/^\/image\s*/i, "")
    .replace(/^\/이미지\s*/, "")
    .replace(/^\/그림\s*/, "")
    .replace(/^\/사진\s*/, "");

  const patternsToRemove = [
    /그림\s*(그려|만들어)\s*(줘|주세요|줄래|줄래요)?/g,
    /이미지\s*(생성|만들어|그려)\s*(줘|주세요|줄래|줄래요)?/g,
    /사진\s*(생성|만들어)\s*(줘|주세요|줄래|줄래요)?/g,
  ];

  for (const pattern of patternsToRemove) {
    cleanedMessage = cleanedMessage.replace(pattern, "");
  }

  return cleanedMessage.trim() || message;
};

export const ImageService = {
  generateImage,
  getAvailableModels,
  getSupportedSizes,
  getAvailableProviders,
  isImageGenerationRequest,
  extractImagePrompt,
};

export default ImageService;

