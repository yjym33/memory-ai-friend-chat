/**
 * 환경변수 유틸리티 함수들
 * 타입 안전한 환경변수 파싱을 제공합니다.
 */

/**
 * 안전하게 정수로 파싱합니다.
 * @param value 환경변수 값
 * @param defaultValue 기본값
 * @returns 파싱된 정수 또는 기본값
 */
export function safeParseInt(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 안전하게 부동소수점으로 파싱합니다.
 * @param value 환경변수 값
 * @param defaultValue 기본값
 * @returns 파싱된 부동소수점 또는 기본값
 */
export function safeParseFloat(
  value: string | undefined,
  defaultValue: number,
): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 안전하게 불린으로 파싱합니다.
 * @param value 환경변수 값
 * @param defaultValue 기본값
 * @returns 파싱된 불린 또는 기본값
 */
export function safeParseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * 환경변수를 안전하게 가져옵니다.
 * @param key 환경변수 키
 * @param defaultValue 기본값
 * @returns 환경변수 값 또는 기본값
 */
export function getEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}
