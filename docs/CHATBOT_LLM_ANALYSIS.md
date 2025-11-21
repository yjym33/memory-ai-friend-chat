# chatbot-llm 서비스 사용 여부 분석

## 확인 결과

### 1. 백엔드 코드 분석

백엔드 코드를 분석한 결과:

- ✅ **`ChatService`는 `LLMAdapterService`를 직접 사용**
  - 위치: `chatbot-backend/src/chat/chat.service.ts`
  - 메서드: `generateLLMResponseStream()` → `llmAdapterService.generateStreamingResponse()`
  
- ❌ **`chatbot-llm` 서비스를 호출하는 코드 없음**
  - 포트 3002로 HTTP 요청을 보내는 코드 없음
  - `chatbot-llm` URL을 참조하는 환경 변수 없음
  - `LLM_SERVICE_URL` 등의 환경 변수 없음

### 2. chatbot-llm 서비스 상태

- **실행 중**: 포트 3002에서 Python 프로세스 실행 중 (PID: 82992)
- **지원 모델**: OpenAI만 지원 (하드코딩됨)
- **문제점**: Anthropic, Google Gemini 미지원

### 3. 결론

**현재 백엔드는 `chatbot-llm` 서비스를 사용하지 않습니다.**

백엔드는 다음과 같이 작동합니다:

```
ChatService.processMessageStream()
  → LLMAdapterService.generateStreamingResponse()
    → Provider (OpenAI/Google/Anthropic) - 직접 API 호출
```

따라서 `chatbot-llm` 서비스가 실행 중이더라도, **백엔드가 이를 호출하지 않으므로 문제가 되지 않습니다**.

## 만약 문제가 지속된다면

### 확인 사항

1. **백엔드 로그 확인**
   - `LLMAdapterService` 사용 로그 확인
   - Provider 선택 로그 확인
   - API 키 조회/복호화 로그 확인

2. **AI 설정 확인**
   - Provider가 `anthropic`으로 변경되었는지
   - 모델이 Anthropic 모델로 선택되었는지

3. **API 키 저장 확인**
   - 프론트엔드에서 API 키 저장 성공 여부
   - 백엔드 로그에서 저장 성공 메시지 확인

## 해결 방법

### chatbot-llm 서비스가 문제라면

만약 `chatbot-llm` 서비스가 어딘가에서 호출되고 있다면:

1. **서비스 중지**
   ```bash
   kill 82992  # PID 확인 후 중지
   ```

2. **서비스 제거** (필요시)
   - `chatbot-llm` 디렉토리 백업 후 제거
   - 또는 사용하지 않도록 설정

### LLMAdapterService 사용 확인

백엔드 로그에서 다음 메시지를 확인하세요:

```
🔑 [스트리밍] anthropic API 키 상태: ...
✅ 사용자 ...의 anthropic API 키 복호화 성공
```

이 메시지가 보이면 `LLMAdapterService`가 정상 작동 중입니다.

## 최종 결론

**`chatbot-llm` 서비스는 현재 사용되지 않으므로, Anthropic 모델 문제의 원인이 아닙니다.**

대신 다음을 확인하세요:
1. AI 설정에서 Provider가 `anthropic`으로 변경되었는지
2. 모델이 Anthropic 모델로 선택되었는지
3. API 키가 제대로 저장되었는지
4. 백엔드 로그에서 API 키 조회/복호화 성공 여부

