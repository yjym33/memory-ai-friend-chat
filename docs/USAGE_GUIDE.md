# 아키텍처 리팩토링 사용 가이드

## 개요

이 가이드는 새로운 아키텍처를 사용하는 방법을 설명합니다.

## 아키텍처 개요

```
Frontend (Next.js)
    ↓
Backend NestJS
    ↓
┌─────────────────────────────────────┐
│  ChatService                         │
│  - 오케스트레이션                    │
│  - ChatbotLlmService 호출           │
│  - LLMAdapterService 호출           │
└─────────────────────────────────────┘
    ↓                    ↓
┌──────────────┐  ┌──────────────┐
│ chatbot-llm  │  │ LLMAdapter   │
│ (Python)     │  │ Service      │
│              │  │              │
│ - 프롬프트   │  │ - OpenAI     │
│   생성       │  │ - Google     │
│ - 메모리     │  │ - Anthropic  │
│   관리       │  │              │
│ - 컨텍스트   │  └──────────────┘
│   관리       │
└──────────────┘
```

## 실행 방법

### 1. chatbot-llm 서비스 실행

```bash
cd chatbot-llm

# 가상환경 활성화 (필요시)
source venv/bin/activate  # macOS/Linux
# 또는
.\venv\Scripts\activate  # Windows

# 서버 실행
python -m src.main
# 또는
python run.py
```

서비스는 `http://localhost:3002`에서 실행됩니다.

### 2. 백엔드 실행

```bash
cd chatbot-backend

# 의존성 설치 (필요시)
npm install

# 환경 변수 설정 확인
# .env 파일에 CHATBOT_LLM_URL=http://localhost:3002 추가

# 서버 실행
npm run start:dev
```

서비스는 `http://localhost:8080`에서 실행됩니다.

### 3. 프론트엔드 실행

```bash
cd chatbot-frontend

# 의존성 설치 (필요시)
npm install

# 서버 실행
npm run dev
```

서비스는 `http://localhost:3000`에서 실행됩니다.

## API 사용 방법

### chatbot-llm 서비스 API

#### 1. 프롬프트 생성

**엔드포인트**: `POST /api/v1/prompt`

**요청**:
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

**응답**:
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

#### 2. 메모리 저장

**엔드포인트**: `POST /api/v1/memory`

**요청**:
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

**응답**:
```json
{
  "memoryId": "mem_789",
  "stored": true,
  "memoryType": "conversation",
  "importance": 5
}
```

#### 3. 컨텍스트 조회

**엔드포인트**: `GET /api/v1/context`

**쿼리 파라미터**:
- `userId`: 사용자 ID (필수)
- `conversationId`: 대화 ID (선택사항)
- `limit`: 최대 조회 메시지 수 (기본값: 6)

**응답**:
```json
{
  "context": [
    {"role": "user", "content": "안녕하세요!"},
    {"role": "assistant", "content": "안녕! 오늘 어때?"}
  ],
  "memorySummary": "중요한 기억 3개: ...",
  "relevantMemories": [],
  "contextLength": 2
}
```

## 테스트

### chatbot-llm 서비스 테스트

```bash
cd chatbot-llm
./test_prompt_api.sh
```

이 스크립트는 다음을 테스트합니다:
1. 헬스 체크
2. 프롬프트 생성 API
3. 메모리 저장 API
4. 컨텍스트 조회 API

### 백엔드 통합 테스트

1. chatbot-llm 서비스 실행 확인
2. 백엔드 실행
3. 프론트엔드에서 채팅 테스트
4. 백엔드 로그 확인:
   - "프롬프트 생성 요청" 메시지
   - "프롬프트 생성 완료" 메시지
   - "메모리 저장 완료" 메시지

### 폴백 테스트

chatbot-llm 서비스를 중지한 상태에서도 채팅이 작동하는지 확인:

1. chatbot-llm 서비스 중지
2. 백엔드에서 채팅 요청
3. 백엔드 로그에서 "폴백 프롬프트 생성" 메시지 확인
4. 채팅이 정상적으로 작동하는지 확인 (메모리 없이)

## 환경 변수

### chatbot-llm (.env)

```env
# 백엔드 URL (AI 설정 조회용)
BACKEND_URL=http://localhost:8080

# 서버 설정
PORT=3002
HOST=0.0.0.0
DEBUG=false

# 로깅 설정
LOG_LEVEL=INFO
```

### 백엔드 (.env)

```env
# chatbot-llm 서비스 URL
CHATBOT_LLM_URL=http://localhost:3002
```

## 트러블슈팅

### chatbot-llm 서비스에 연결할 수 없음

**증상**: 백엔드 로그에 "chatbot-llm 서비스에 연결할 수 없습니다" 메시지

**해결 방법**:
1. chatbot-llm 서비스가 실행 중인지 확인
2. `CHATBOT_LLM_URL` 환경 변수가 올바른지 확인
3. 포트 3002가 사용 가능한지 확인

### 프롬프트 생성 실패

**증상**: 프롬프트 생성 API 호출 실패

**해결 방법**:
1. chatbot-llm 서비스 로그 확인
2. 요청 형식이 올바른지 확인
3. AI 설정 데이터가 올바른지 확인

### 메모리 저장 실패

**증상**: 메모리 저장 API 호출 실패 (하지만 채팅은 정상 작동)

**참고**: 메모리 저장 실패는 치명적이지 않습니다. 채팅은 정상적으로 진행되며, 메모리만 저장되지 않습니다.

**해결 방법**:
1. chatbot-llm 서비스 로그 확인
2. 메모리 서비스가 정상 작동하는지 확인

## 성능 최적화

### 1. 타임아웃 설정

현재 타임아웃은 5초로 설정되어 있습니다. 필요시 조정 가능:

```typescript
// chatbot-backend/src/chatbot-llm/chatbot-llm.service.ts
private readonly timeout: number = 5000; // 조정 가능
```

### 2. 메모리 캐싱

메모리 조회 결과를 캐싱하여 성능 향상 가능 (향후 구현 예정)

### 3. 배치 메모리 저장

여러 메모리를 한 번에 저장하는 API 추가 가능 (향후 구현 예정)

## 확장 계획

1. **임베딩 기반 메모리 검색**: 키워드 매칭 대신 벡터 검색 사용
2. **프롬프트 캐싱**: 동일한 설정의 프롬프트 캐싱
3. **배치 처리**: 여러 메모리를 한 번에 저장
4. **모니터링**: 메트릭 수집 및 대시보드

