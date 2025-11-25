import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from '../types/image.types';

/**
 * 이미지 생성 Provider 공통 인터페이스
 * 모든 이미지 생성 Provider는 이 인터페이스를 구현해야 합니다.
 */
export interface IImageProvider {
  /**
   * 이미지를 생성합니다.
   * @param request - 이미지 생성 요청 정보
   * @param apiKey - 사용자별 API 키 (선택사항)
   * @returns 생성된 이미지 정보
   */
  generateImage(
    request: ImageGenerationRequest,
    apiKey?: string,
  ): Promise<ImageGenerationResponse>;

  /**
   * 모델이 유효한지 검증합니다.
   * @param model - 검증할 모델 이름
   * @returns 유효 여부
   */
  validateModel(model: string): boolean;

  /**
   * 사용 가능한 모델 목록을 반환합니다.
   * @returns 모델 목록
   */
  getAvailableModels(): string[];

  /**
   * Provider 이름을 반환합니다.
   * @returns Provider 이름
   */
  getName(): string;

  /**
   * Provider의 기본 모델을 반환합니다.
   * @returns 기본 모델 이름
   */
  getDefaultModel(): string;

  /**
   * 지원되는 이미지 크기 목록을 반환합니다.
   * @param model - 모델 이름 (선택사항)
   * @returns 지원 크기 목록
   */
  getSupportedSizes(model?: string): string[];
}

