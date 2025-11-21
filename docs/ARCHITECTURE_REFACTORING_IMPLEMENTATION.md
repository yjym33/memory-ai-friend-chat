# 아키텍처 리팩토링 구현 완료 문서

## 개요

백엔드와 chatbot-llm 서비스의 역할을 명확히 분리하여 아키텍처를 개선했습니다.

**변경 전**:
- 백엔드: 프롬프트 생성 + LLM 호출 + 메모리 관리 (일부)
- chatbot-llm: 사용되지 않음 (LLM 호출만 하드코딩)

**변경 후**:
- **백엔드**: 오케스트레이션 + LLM 호출 (다중 Provider 지원)
- **chatbot-llm**: 프롬프트 생성 + 메모리 관리 + 컨텍스트 관리

## 구현된 파일

### chatbot-llm 서비스 (Python FastAPI)

#### 1. 프롬프트 생성 API
**파일**: `chatbot-llm/src/api/prompt_routes.py`

**주요 기능**:
- `POST /api/v1/prompt`: 개인화된 프롬프트 생성
  - AI 설정 통합
  - 메모리 통합
  - 대화 컨텍스트 통합
  - 완전한 메시지 배열 반환

**요청 예시**:
```json
{
  "userId": "user_123",
  "conversationId": "conv_456",
  "message": "안녕하세요!",
  "aiSettings": {
    "personalityType": "친근함",
    "speechStyle": "반말",
    "emojiUsage": 3,
    "empathyLevel": 4,
    "nickname": "친구"
  },
  "maxContextMessages": 6
}
```

**응답 예시**:
```json
{
  "systemPrompt": "당신은 '친구'의 AI 친구 '루나'입니다...",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "안녕하세요!"}
  ],
  "contextLength": 0,
  "memoryIncluded": true
}
```

#### 2. 메모리 관리 API
**파일**: `chatbot-llm/src/api/memory_routes.py`

**주요 기능**:
- `POST /api/v1/memory`: 메모리 저장
  - 사용자 메시지와 AI 응답 저장
  - 중요도에 따른 단기/장기 메모리 분류
  - 대화 컨텍스트 업데이트

- `GET /api/v1/context`: 컨텍스트 조회
  - 대화 컨텍스트 반환
  - 메모리 요약 제공
  - 관련 메모리 목록 제공

**요청 예시** (메모리 저장):
```json
{
  "userId": "user_123",
  "conversationId": "conv_456",
  "userMessage": "안녕하세요!",
  "assistantMessage": "안녕! 오늘 어때?",
  "importance": 5,
  "memoryType": "conversation"
}
```

**응답 예시**:
```json
{
  "memoryId": "mem_789",
  "stored": true,
  "memoryType": "conversation",
  "importance": 5
}
```

#### 3. 메인 앱 수정
**파일**: `chatbot-llm/src/main.py`

**변경 사항**:
- 새로운 라우터 등록 (`prompt_router`, `memory_router`)
- 서비스 설명 업데이트 ("메모리 관리 및 프롬프트 생성 서비스")

#### 4. 메모리 서비스 개선
**파일**: `chatbot-llm/src/services/memory_service.py`

**추가된 메서드**:
- `get_relevant_memories(query, limit)`: 관련 메모리 추출
- `get_memory_summary()`: 메모리 요약 생성

### 백엔드 (NestJS)

#### 1. ChatbotLlmService
**파일**: `chatbot-backend/src/chatbot-llm/chatbot-llm.service.ts`

**주요 기능**:
- `generatePrompt()`: chatbot-llm 서비스에 프롬프트 생성 요청
- `saveMemory()`: chatbot-llm 서비스에 메모리 저장 요청
- `getContext()`: chatbot-llm 서비스에서 컨텍스트 조회
- 폴백 로직: chatbot-llm 서비스 장애 시 기본 프롬프트 생성
- 에러 처리: 타임아웃, 연결 실패 등 처리

**특징**:
- HTTP 통신 (axios 사용)
- 타임아웃 설정 (5초)
- 에러 로깅 및 폴백
- 메모리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음

#### 2. ChatbotLlmModule
**파일**: `chatbot-backend/src/chatbot-llm/chatbot-llm.module.ts`

**역할**:
- `ChatbotLlmService` 제공 및 export
- 다른 모듈에서 사용 가능하도록 설정

#### 3. ChatService 리팩토링
**파일**: `chatbot-backend/src/chat/chat.service.ts`

**변경 사항**:
- `ChatbotLlmService` 주입
- `processPersonalMessageStream()` 메서드 수정:
  1. chatbot-llm 서비스에서 프롬프트 생성
  2. LLMAdapterService로 LLM 호출
  3. chatbot-llm 서비스에 메모리 저장 (비동기)
- `buildPersonalSystemPrompt()` 메서드는 더 이상 사용하지 않음 (주석 처리 가능)

#### 4. ChatModule 수정
**파일**: `chatbot-backend/src/chat/chat.module.ts`

**변경 사항**:
- `ChatbotLlmModule` import 추가

#### 5. 환경 변수 설정
**파일**: `chatbot-backend/src/config/env.validation.ts`

**추가된 환경 변수**:
- `CHATBOT_LLM_URL`: chatbot-llm 서비스 URL (기본값: `http://localhost:3002`)

## 아키텍처 흐름

### 새로운 요청 흐름

```
1. 사용자 메시지 전송 (Frontend)
   ↓
2. ChatService.processPersonalMessageStream()
   ↓
3. ChatbotLlmService.generatePrompt()
   → HTTP POST /api/v1/prompt (chatbot-llm)
   → AI 설정 + 메모리 + 컨텍스트 통합
   → 개인화된 프롬프트 생성
   ↓
4. LLMAdapterService.generateStreamingResponse()
   → 다중 Provider 지원 (OpenAI/Google/Anthropic)
   → 스트리밍 응답 생성
   ↓
5. ChatbotLlmService.saveMemory() (비동기)
   → HTTP POST /api/v1/memory (chatbot-llm)
   → 메모리 저장
   ↓
6. 응답 반환 (Frontend)
```

## 환경 변수 설정

### 백엔드 (.env)

```env
# chatbot-llm 서비스 URL
CHATBOT_LLM_URL=http://localhost:3002
```

### chatbot-llm (.env)

```env
# OpenAI API 키 제거 (더 이상 사용 안 함)
# OPENAI_API_KEY=your-key-here

# 백엔드 URL (AI 설정 조회용)
BACKEND_URL=http://localhost:8080

# 서버 설정
PORT=3002
HOST=0.0.0.0
DEBUG=false
```

## 테스트 방법

### 1. chatbot-llm 서비스 테스트

```bash
cd chatbot-llm
python -m src.main
```

**프롬프트 생성 테스트**:
```bash
curl -X POST "http://localhost:3002/api/v1/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "message": "안녕하세요!",
    "aiSettings": {
      "personalityType": "친근함",
      "speechStyle": "반말",
      "emojiUsage": 3,
      "nickname": "친구"
    }
  }'
```

**메모리 저장 테스트**:
```bash
curl -X POST "http://localhost:3002/api/v1/memory" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "userMessage": "안녕하세요!",
    "assistantMessage": "안녕! 오늘 어때?",
    "importance": 5
  }'
```

### 2. 백엔드 통합 테스트

1. chatbot-llm 서비스 실행 (`http://localhost:3002`)
2. 백엔드 실행 (`http://localhost:8080`)
3. 프론트엔드에서 채팅 테스트
4. 백엔드 로그에서 다음 확인:
   - "프롬프트 생성 요청" 메시지
   - "프롬프트 생성 완료" 메시지
   - "메모리 저장 완료" 메시지

### 3. 폴백 테스트

1. chatbot-llm 서비스 중지
2. 백엔드에서 채팅 요청
3. 백엔드 로그에서 "chatbot-llm 서비스 사용 불가 - 폴백 프롬프트 생성" 메시지 확인
4. 채팅이 정상적으로 작동하는지 확인 (메모리 없이)

## 주요 개선 사항

### 1. 역할 분리
- **백엔드**: 오케스트레이션과 LLM 호출에 집중
- **chatbot-llm**: 메모리 관리와 프롬프트 생성에 집중

### 2. 재사용성
- chatbot-llm 서비스를 다른 프로젝트에서도 활용 가능
- 독립적인 서비스로 확장 가능

### 3. 확장성
- 메모리 시스템을 독립적으로 개선 가능
- 프롬프트 생성 로직을 독립적으로 개선 가능

### 4. 유지보수성
- 각 서비스의 책임이 명확해짐
- 독립적인 테스트/배포 가능

### 5. 에러 처리
- chatbot-llm 서비스 장애 시 폴백 로직 제공
- 메모리 저장 실패는 치명적이지 않으므로 대화는 계속 진행

## 주의사항

### 1. 네트워크 지연
- HTTP 호출 추가로 인한 지연 (약 50-200ms)
- 타임아웃 설정 (5초)으로 장애 상황 대응

### 2. 에러 처리
- chatbot-llm 서비스 장애 시 폴백 프롬프트 생성
- 메모리 저장 실패는 대화 진행에 영향 없음

### 3. 데이터 동기화
- 백엔드 DB의 대화 기록과 chatbot-llm의 메모리는 별도 관리
- 필요시 동기화 로직 추가 가능

## 향후 개선 사항

### 1. 메모리 시스템 개선
- 임베딩 기반 유사도 검색 (현재는 키워드 매칭)
- 벡터 데이터베이스 통합 (Pinecone, Weaviate 등)

### 2. 프롬프트 최적화
- 프롬프트 캐싱
- 동적 프롬프트 조정

### 3. 성능 최적화
- 배치 메모리 저장
- 비동기 처리 개선

### 4. 모니터링
- chatbot-llm 서비스 헬스 체크
- 메트릭 수집 및 대시보드

## 결론

이번 리팩토링으로 백엔드와 chatbot-llm 서비스의 역할이 명확히 분리되었습니다.

**백엔드**는 오케스트레이션과 LLM 호출에 집중하고,
**chatbot-llm**은 메모리 관리와 프롬프트 생성에 집중합니다.

각 서비스가 독립적으로 동작하면서도 유기적으로 협력하는 아키텍처가 완성되었습니다.

