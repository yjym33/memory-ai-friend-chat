/**
 * LLM 관련 상수 정의
 */

export const LLM_CONFIG = {
  // OpenAI 모델 설정
  MODEL: 'gpt-4',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.8,
  TOP_P: 0.9,
  FREQUENCY_PENALTY: 0.5, // 반복 방지
  PRESENCE_PENALTY: 0.3, // 새로운 주제 유도

  // 대화 컨텍스트 설정
  MAX_CONTEXT_MESSAGES: 6, // 최근 6개 메시지 (3턴)
  CHUNK_SIZE: 5, // 스트리밍 청크 크기
  STREAM_DELAY_MS: 20, // 스트리밍 지연 시간

  // 문서 검색 설정
  DEFAULT_MAX_SEARCH_RESULTS: 5,
  DEFAULT_CONFIDENCE_THRESHOLD: 0.7,
} as const;

export const ERROR_MESSAGES = {
  // 일반 에러
  GENERAL_ERROR: '죄송해요, 처리 중 오류가 발생했습니다.',
  RETRY_MESSAGE: '다시 말씀해 주세요.',
  
  // 인증 에러
  UNAUTHORIZED: '인증이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  
  // 리소스 에러
  CONVERSATION_NOT_FOUND: '대화를 찾을 수 없습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  
  // 기업 모드 에러
  BUSINESS_MODE_REQUIRES_ORG: '기업 모드를 사용하려면 조직에 속해야 합니다.',
  NO_DOCUMENTS_FOUND: '관련 문서를 찾을 수 없습니다.',
  
  // LLM 에러
  LLM_API_FAILED: 'AI 응답 생성에 실패했습니다.',
  STREAMING_ERROR: '스트리밍 처리 중 오류가 발생했습니다.',
} as const;

export const SUCCESS_MESSAGES = {
  CONVERSATION_CREATED: '새 대화가 생성되었습니다.',
  CONVERSATION_UPDATED: '대화가 업데이트되었습니다.',
  CONVERSATION_DELETED: '대화가 삭제되었습니다.',
} as const;

export const SSE_EVENT_TYPES = {
  TOKEN: 'token',
  SOURCES: 'sources',
  DONE: 'done',
  ERROR: 'error',
} as const;

