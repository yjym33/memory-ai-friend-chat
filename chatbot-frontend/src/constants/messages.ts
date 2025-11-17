/**
 * 애플리케이션 전체에서 사용되는 메시지 상수
 */

export const ERROR_MESSAGES = {
  // 네트워크 에러
  NETWORK_ERROR: "네트워크 연결에 실패했습니다.",
  SERVER_ERROR: "서버 오류가 발생했습니다.",
  TIMEOUT: "요청 시간이 초과되었습니다.",

  // 인증 에러
  UNAUTHORIZED: "로그인이 필요합니다.",
  FORBIDDEN: "권한이 없습니다.",
  SESSION_EXPIRED: "세션이 만료되었습니다. 다시 로그인해주세요.",

  // 데이터 에러
  NOT_FOUND: "요청한 데이터를 찾을 수 없습니다.",
  INVALID_DATA: "잘못된 데이터입니다.",
  
  // 채팅 에러
  FETCH_CONVERSATIONS_FAILED: "대화 목록을 불러오는데 실패했습니다.",
  SEND_MESSAGE_FAILED: "메시지 전송에 실패했습니다.",
  CREATE_CONVERSATION_FAILED: "새 대화 생성에 실패했습니다.",
  DELETE_CONVERSATION_FAILED: "대화 삭제에 실패했습니다.",
  
  // 파일 에러
  FILE_UPLOAD_FAILED: "파일 업로드에 실패했습니다.",
  FILE_TOO_LARGE: "파일 크기가 너무 큽니다.",
  INVALID_FILE_TYPE: "지원하지 않는 파일 형식입니다.",

  // 일반 에러
  UNKNOWN_ERROR: "알 수 없는 오류가 발생했습니다.",
} as const;

export const SUCCESS_MESSAGES = {
  // 채팅
  MESSAGE_SENT: "메시지를 전송했습니다.",
  CONVERSATION_CREATED: "새 대화가 생성되었습니다.",
  CONVERSATION_DELETED: "대화가 삭제되었습니다.",
  
  // 파일
  FILE_UPLOADED: "파일이 업로드되었습니다.",
  
  // 인증
  LOGIN_SUCCESS: "로그인되었습니다.",
  LOGOUT_SUCCESS: "로그아웃되었습니다.",
  
  // 설정
  SETTINGS_SAVED: "설정이 저장되었습니다.",
} as const;

export const INFO_MESSAGES = {
  LOADING: "로딩 중...",
  PROCESSING: "처리 중...",
  SAVING: "저장 중...",
  UPLOADING: "업로드 중...",
} as const;

