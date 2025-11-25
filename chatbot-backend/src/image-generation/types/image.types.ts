/**
 * 이미지 생성 Provider 타입 정의
 */
export enum ImageProvider {
  DALLE = 'dalle', // OpenAI DALL-E
  STABILITY = 'stability', // Stability AI (Stable Diffusion)
  GOOGLE_IMAGEN = 'google-imagen', // Google Imagen (Nano Banana)
}

/**
 * 이미지 생성 모델 타입
 */
export enum ImageModel {
  // OpenAI DALL-E
  DALLE_3 = 'dall-e-3',
  DALLE_2 = 'dall-e-2',

  // Stability AI
  SDXL_1_0 = 'stable-diffusion-xl-1024-v1-0',
  SD_1_6 = 'stable-diffusion-v1-6',

  // Google Imagen (Nano Banana)
  GEMINI_FLASH_IMAGE = 'gemini-2.0-flash-exp',
  GEMINI_FLASH_IMAGE_PREVIEW = 'gemini-2.0-flash-preview-image-generation',
}

/**
 * 이미지 크기 타입
 */
export type ImageSize =
  | '256x256'
  | '512x512'
  | '768x768'
  | '1024x1024'
  | '1792x1024'
  | '1024x1792';

/**
 * 이미지 품질 타입
 */
export type ImageQuality = 'standard' | 'hd';

/**
 * 이미지 스타일 타입
 */
export type ImageStyle = 'vivid' | 'natural';

/**
 * 이미지 생성 요청 타입
 */
export interface ImageGenerationRequest {
  prompt: string;
  negativePrompt?: string; // 원하지 않는 요소
  model?: string;
  size?: ImageSize;
  quality?: ImageQuality;
  style?: ImageStyle;
  n?: number; // 생성할 이미지 수
  userId?: string; // 사용자 ID (API 키 결정용)
}

/**
 * 이미지 생성 응답 타입
 */
export interface ImageGenerationResponse {
  images: GeneratedImage[];
  model: string;
  provider: ImageProvider;
  usage?: {
    cost?: number; // 예상 비용 (USD)
  };
}

/**
 * 생성된 이미지 정보
 */
export interface GeneratedImage {
  url: string; // 이미지 URL (임시)
  base64?: string; // Base64 인코딩 (옵션)
  revisedPrompt?: string; // DALL-E가 수정한 프롬프트
  width: number;
  height: number;
}

/**
 * 이미지 생성 설정 타입
 */
export interface ImageGenerationConfig {
  provider: ImageProvider;
  model: string;
  defaultSize?: ImageSize;
  defaultQuality?: ImageQuality;
  defaultStyle?: ImageStyle;
  maxImagesPerRequest?: number;
}

