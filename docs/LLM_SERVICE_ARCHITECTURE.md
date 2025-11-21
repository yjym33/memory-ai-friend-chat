# LLM 서비스 아키텍처 분석

## 현재 구조

### 백엔드 (NestJS)

현재 백엔드는 **`LLMAdapterService`**를 직접 사용하여 다양한 LLM Provider를 지원합니다:

1. **LLMAdapterService** (TypeScript/NestJS)

   - 위치: `chatbot-backend/src/llm/services/llm-adapter.service.ts`
   - 기능: OpenAI, Google, Anthropic 등 다양한 Provider 지원
   - 사용: `ChatService`에서 직접 호출

2. **사용 흐름:**
   ```
   ChatService.processMessageStream()
     → LLMAdapterService.generateStreamingResponse()
       → Provider (OpenAI/Google/Anthropic)
   ```

### chatbot-llm (Python FastAPI) ⚠️

**현재 상태**: 백엔드에서 사용되지 않는 것으로 보임

1. **위치**: `chatbot-llm/` (별도 Python 서비스)
2. **기능**: OpenAI만 지원 (하드코딩됨)
3. **문제점**:
   - `ChatOpenAI`만 사용
   - Anthropic, Google Gemini 지원 안 함
   - 모델 선택 불가

## 원인 분석

### 가능한 원인 1: chatbot-llm 서비스가 실행 중이고 사용되고 있음

**증상:**

- 백엔드가 `chatbot-llm` 서비스(포트 3002)를 호출
- `chatbot-llm`이 OpenAI만 지원하므로 Anthropic 모델 처리 불가

**확인 방법:**

```bash
# chatbot-llm 서비스가 실행 중인지 확인
ps aux | grep python | grep llm
lsof -i :3002
```

**해결 방법:**

1. `chatbot-llm` 서비스 중지
2. 또는 `chatbot-llm` 서비스를 다중 Provider 지원하도록 수정

### 가능한 원인 2: 백엔드가 LLMAdapterService를 사용하지만 다른 문제

**확인 방법:**

- 백엔드 로그에서 `LLMAdapterService` 사용 확인
- API 키 저장/복호화 로그 확인

## chatbot-llm 서비스 확인

### 서비스 실행 여부 확인

```bash
cd chatbot-llm
ps aux | grep "uvicorn\|python.*llm"
```

### chatbot-llm이 사용되는지 확인

백엔드 코드에서 다음을 확인:

- `chatbot-llm` URL로 HTTP 요청을 보내는 코드
- 환경 변수에 `LLM_SERVICE_URL` 또는 유사한 설정

현재 코드 분석 결과, **백엔드는 `LLMAdapterService`를 직접 사용**하므로 `chatbot-llm`을 호출하지 않는 것으로 보입니다.

## 해결 방법

### 1. chatbot-llm 서비스가 사용되지 않는다면 (현재 상황)

**확인 사항:**

1. 백엔드가 `LLMAdapterService`를 사용하는지 확인 ✅ (확인됨)
2. AI 설정에서 Provider가 `anthropic`으로 변경되었는지 확인
3. 모델이 Anthropic 모델로 선택되었는지 확인
4. API 키가 저장되었는지 확인 (로그 확인)

### 2. chatbot-llm 서비스가 사용된다면

**해결 방법:**

- `chatbot-llm` 서비스를 다중 Provider 지원하도록 수정
- 또는 `chatbot-llm` 서비스를 사용하지 않도록 설정 변경

## 결론

현재 백엔드 코드를 보면:

- ✅ `LLMAdapterService` 사용 (다중 Provider 지원)
- ❌ `chatbot-llm` 서비스 사용 안 함 (코드에서 호출하지 않음)

따라서 **`chatbot-llm`이 원인일 가능성은 낮습니다**.

대신 다음을 확인하세요:

1. **AI 설정**에서 Provider가 `anthropic`으로 변경되었는지
2. **모델**이 Anthropic 모델로 선택되었는지
3. **API 키**가 저장되었는지 (로그 확인)
4. **백엔드 로그**에서 API 키 조회/복호화 성공 여부
