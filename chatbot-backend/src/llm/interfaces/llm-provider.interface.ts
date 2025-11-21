import { LLMRequest, LLMResponse, LLMStreamChunk } from '../types/llm.types';

/**
 * LLM Provider 공통 인터페이스
 * 모든 LLM Provider는 이 인터페이스를 구현해야 합니다.
 */
export interface ILLMProvider {
  /**
   * LLM 응답을 생성합니다.
   * @param request - LLM 요청 정보
   * @param apiKey - 사용자별 API 키 (선택사항)
   * @returns LLM 응답
   */
  generateResponse(request: LLMRequest, apiKey?: string): Promise<LLMResponse>;

  /**
   * LLM 스트리밍 응답을 생성합니다.
   * @param request - LLM 요청 정보
   * @param onChunk - 각 청크를 받을 때 호출되는 콜백 함수
   * @param apiKey - 사용자별 API 키 (선택사항)
   */
  generateStreamingResponse(
    request: LLMRequest,
    onChunk: (chunk: LLMStreamChunk) => void,
    apiKey?: string,
  ): Promise<void>;

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
}

