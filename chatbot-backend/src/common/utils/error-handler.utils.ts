import { Logger } from '@nestjs/common';

/**
 * 에러 처리 유틸리티 함수
 */

/**
 * 에러를 로깅하고 사용자에게 보여줄 메시지를 반환합니다.
 * @param logger - NestJS Logger 인스턴스
 * @param context - 에러가 발생한 컨텍스트
 * @param error - 에러 객체
 * @param userMessage - 사용자에게 보여줄 메시지
 * @returns 사용자 메시지
 */
export function logAndReturnError(
  logger: Logger,
  context: string,
  error: unknown,
  userMessage: string,
): string {
  logger.error(`${context}:`, error);
  return userMessage;
}

/**
 * try-catch 패턴을 간소화하는 헬퍼 함수
 * @param operation - 실행할 비동기 작업
 * @param errorMessage - 에러 발생 시 반환할 메시지
 * @param logger - 로거 (선택)
 * @param context - 로그 컨텍스트 (선택)
 * @returns 성공 시 결과, 실패 시 null
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorMessage: string,
  logger?: Logger,
  context?: string,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (logger && context) {
      logger.error(`${context}: ${errorMessage}`, error);
    }
    return null;
  }
}

/**
 * 에러를 안전하게 문자열로 변환합니다.
 * @param error - 에러 객체
 * @returns 에러 메시지 문자열
 */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러 스택 트레이스를 안전하게 가져옵니다.
 * @param error - 에러 객체
 * @returns 스택 트레이스 또는 undefined
 */
export function safeErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
}

