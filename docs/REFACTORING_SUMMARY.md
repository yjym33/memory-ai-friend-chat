# 🔄 코드 리팩토링 요약

## 📅 작업 일자
2025년 11월 17일

## 🎯 리팩토링 목표
- 코드 반복 최소화
- 가독성 향상
- 유지보수성 개선
- 관심사 분리 (Separation of Concerns)

---

## ✅ 완료된 작업

### 1. **백엔드: 파일 추출 로직 분리**
**문제점:**
- `chat.controller.ts`가 530줄 이상으로 너무 큼
- 파일 추출 로직이 컨트롤러에 포함되어 있음 (300+ 줄)
- 단일 책임 원칙 위반

**해결책:**
```
✅ 생성: chatbot-backend/src/common/services/file-extraction.service.ts
```
- PDF, DOCX, XLSX, TXT 파일 추출 로직을 별도 서비스로 분리
- Strategy 패턴을 사용하여 확장 가능한 구조 구현
- 컨트롤러는 이제 서비스만 호출하여 파일 추출 수행

**결과:**
- `chat.controller.ts`: 530줄 → **340줄** (190줄 감소, 36% 감소)
- 파일 추출 로직 재사용 가능

---

### 2. **백엔드: LLM 관련 로직 분리**
**문제점:**
- `chat.service.ts`가 750줄 이상으로 너무 큼
- LLM API 호출 로직이 서비스에 직접 포함됨
- OpenAI API 관련 설정이 여러 곳에 분산

**해결책:**
```
✅ 생성: chatbot-backend/src/common/services/llm.service.ts
```
- LLM API 통신 로직을 별도 서비스로 분리
- 스트리밍 처리 로직 캡슐화
- UTF-8 디코딩 로직 통합
- 메시지 히스토리 구성 로직 추상화

**주요 메서드:**
- `generateStreamingResponse()` - 스트리밍 방식 응답 생성
- `generateResponse()` - 일반 응답 생성
- `buildMessageHistory()` - 메시지 히스토리 구성

**결과:**
- LLM 관련 로직 중앙화
- 테스트 및 유지보수 용이성 향상
- 다른 모듈에서도 재사용 가능

---

### 3. **백엔드: 매직 넘버와 하드코딩된 문자열 제거**
**문제점:**
```typescript
// 이전 코드
const recentMessages = conversation.messages.slice(-6); // 6은 무엇?
temperature: 0.8, // 왜 0.8?
max_tokens: 500, // 왜 500?
```

**해결책:**
```
✅ 생성: chatbot-backend/src/common/constants/llm.constants.ts
```

**주요 상수:**
```typescript
export const LLM_CONFIG = {
  MODEL: 'gpt-4',
  MAX_TOKENS: 500,
  TEMPERATURE: 0.8,
  TOP_P: 0.9,
  FREQUENCY_PENALTY: 0.5,
  PRESENCE_PENALTY: 0.3,
  MAX_CONTEXT_MESSAGES: 6, // 최근 6개 메시지
} as const;

export const ERROR_MESSAGES = {
  GENERAL_ERROR: '죄송해요, 처리 중 오류가 발생했습니다.',
  CONVERSATION_NOT_FOUND: '대화를 찾을 수 없습니다.',
  LLM_API_FAILED: 'AI 응답 생성에 실패했습니다.',
  // ...
} as const;

export const SSE_EVENT_TYPES = {
  TOKEN: 'token',
  SOURCES: 'sources',
  DONE: 'done',
  ERROR: 'error',
} as const;
```

**결과:**
- 코드 가독성 향상
- 설정 변경 시 한 곳만 수정하면 됨
- 값의 의미가 명확해짐

---

### 4. **백엔드: 대화 관련 유틸리티 함수 생성**
**문제점:**
- 대화 검증 로직이 여러 곳에 반복됨
- SSE 이벤트 포맷팅 로직 중복

**해결책:**
```
✅ 생성: chatbot-backend/src/common/utils/conversation.utils.ts
```

**주요 함수:**
```typescript
// 대화 존재 여부 검증
validateConversationExists(conversation, conversationId)

// 대화 메시지 업데이트 (불변성 유지)
createUpdatedMessages(conversation, userMessage, assistantMessage, sources)

// SSE 이벤트 포맷팅
formatSseEvent(type, content)
```

**결과:**
- DRY 원칙 준수 (Don't Repeat Yourself)
- 일관된 에러 처리
- 코드 중복 제거

---

### 5. **백엔드: 에러 처리 유틸리티**
**문제점:**
```typescript
// 여러 곳에서 반복되는 패턴
try {
  // 로직
} catch (error) {
  console.error('Error:', error);
  return { error: '오류 메시지' };
}
```

**해결책:**
```
✅ 생성: chatbot-backend/src/common/utils/error-handler.utils.ts
```

**주요 함수:**
```typescript
// 에러 로깅 및 사용자 메시지 반환
logAndReturnError(logger, context, error, userMessage)

// try-catch 패턴 간소화
tryCatch(operation, errorMessage, logger, context)

// 안전한 에러 메시지 추출
safeErrorMessage(error)
```

**결과:**
- 에러 처리 로직 통합
- 로깅 일관성 확보

---

### 6. **프론트엔드: 상태 업데이트 헬퍼 함수 생성**
**문제점:**
- `useChat.ts`에서 같은 상태 업데이트 패턴이 5번 이상 반복됨
```typescript
// 이전 코드
setConversations((prev) =>
  prev.map((conv) => {
    if (conv.id === activeChatId) {
      const messages = [...conv.messages];
      const lastIndex = messages.length - 1;
      messages[lastIndex] = {
        ...messages[lastIndex],
        content: messages[lastIndex].content + token,
      };
      return { ...conv, messages };
    }
    return conv;
  })
);
```

**해결책:**
```
✅ 생성: chatbot-frontend/src/utils/conversationHelpers.ts
```

**주요 함수:**
```typescript
// 대화에 메시지 추가
addMessageToConversation(conversations, conversationId, message)

// 마지막 assistant 메시지에 토큰 추가
appendTokenToLastAssistantMessage(conversations, conversationId, token)

// 마지막 assistant 메시지에 출처 추가
addSourcesToLastAssistantMessage(conversations, conversationId, sources)

// 빈 assistant 메시지 생성
createEmptyAssistantMessage()

// 사용자 메시지 생성
createUserMessage(content)
```

**개선된 코드:**
```typescript
// 이후 코드
setConversations((prev) =>
  appendTokenToLastAssistantMessage(prev, activeChatId, token)
);
```

**결과:**
- 코드 가독성 크게 향상
- React 불변성 원칙 준수
- 재사용 가능한 헬퍼 함수

---

### 7. **프론트엔드: 에러 메시지 상수화**
**문제점:**
- 에러 메시지가 여러 곳에 하드코딩됨
- 일관성 부족

**해결책:**
```
✅ 생성: chatbot-frontend/src/constants/messages.ts
```

**주요 상수:**
```typescript
export const ERROR_MESSAGES = {
  FETCH_CONVERSATIONS_FAILED: "대화 목록을 불러오는데 실패했습니다.",
  SEND_MESSAGE_FAILED: "메시지 전송에 실패했습니다.",
  CREATE_CONVERSATION_FAILED: "새 대화 생성에 실패했습니다.",
  DELETE_CONVERSATION_FAILED: "대화 삭제에 실패했습니다.",
  // ...
} as const;
```

**결과:**
- 에러 메시지 일관성 확보
- 다국어 지원 준비 완료
- 유지보수 용이성 향상

---

## 📊 리팩토링 효과

### 코드 라인 수 변화
| 파일 | 이전 | 이후 | 감소 |
|------|------|------|------|
| `chat.controller.ts` | 530줄 | 340줄 | **-36%** |
| `chat.service.ts` | 750줄 | 680줄 | **-9%** |
| `useChat.ts` | 294줄 | 254줄 | **-14%** |

### 새로 생성된 파일
**백엔드:**
1. `common/constants/llm.constants.ts` (87줄)
2. `common/services/llm.service.ts` (175줄)
3. `common/services/file-extraction.service.ts` (209줄)
4. `common/utils/conversation.utils.ts` (73줄)
5. `common/utils/error-handler.utils.ts` (74줄)

**프론트엔드:**
1. `utils/conversationHelpers.ts` (144줄)
2. `constants/messages.ts` (65줄)

**총 추가:** 827줄 (재사용 가능한 유틸리티)

---

## 🎨 코드 품질 개선

### Before (이전)
```typescript
// chat.service.ts - 750줄, 모든 로직이 한 파일에
async processMessageStream() {
  // LLM API 호출 로직 (100+ 줄)
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4', // 매직 넘버
      messages: messages,
      max_tokens: 500, // 매직 넘버
      temperature: 0.8, // 매직 넘버
      // ...
    }
  );
  
  // 스트림 처리 로직 (50+ 줄)
  // ...
}
```

### After (이후)
```typescript
// chat.service.ts - 깔끔하고 읽기 쉬움
async processMessageStream() {
  const messages = this.llmService.buildMessageHistory(
    systemPrompt,
    conversation?.messages || [],
    message,
    LLM_CONFIG.MAX_CONTEXT_MESSAGES, // 명확한 상수
  );
  
  await this.llmService.generateStreamingResponse(messages, onChunk);
}
```

---

## ✅ 리팩토링 원칙 준수

### 1. **단일 책임 원칙 (Single Responsibility Principle)**
- ✅ 각 서비스가 하나의 책임만 가짐
- ✅ 파일 추출 → `FileExtractionService`
- ✅ LLM 통신 → `LlmService`

### 2. **DRY 원칙 (Don't Repeat Yourself)**
- ✅ 반복되는 로직을 헬퍼 함수로 추출
- ✅ 상태 업데이트 로직 중앙화
- ✅ 에러 처리 로직 통합

### 3. **관심사 분리 (Separation of Concerns)**
- ✅ 비즈니스 로직과 API 호출 분리
- ✅ 상수와 로직 분리
- ✅ UI 업데이트 로직과 데이터 처리 분리

### 4. **코드 가독성 (Code Readability)**
- ✅ 의미 있는 함수명
- ✅ 매직 넘버 제거
- ✅ 명확한 주석

---

## 🧪 테스트 결과

### 빌드 테스트
```bash
✅ 백엔드: npm run build - 성공
✅ 프론트엔드: npm run build - 성공
```

### 린트 테스트
```bash
✅ 백엔드: 0 linter errors
✅ 프론트엔드: 0 linter errors (리팩토링된 파일)
```

---

## 📈 다음 단계 권장 사항

### 단기 (1-2주)
1. **테스트 코드 작성**
   - `LlmService`에 대한 단위 테스트
   - `FileExtractionService`에 대한 단위 테스트
   - 헬퍼 함수들에 대한 테스트

2. **문서화**
   - 각 서비스에 대한 API 문서 작성
   - 사용 예제 추가

### 중기 (1개월)
1. **추가 리팩토링**
   - `agent.service.ts` (2000줄+) 분리 검토
   - `document.service.ts` 리팩토링

2. **성능 최적화**
   - LLM 응답 캐싱
   - 파일 추출 결과 캐싱

### 장기 (3개월+)
1. **아키텍처 개선**
   - CQRS 패턴 적용 검토
   - 이벤트 기반 아키텍처 고려

2. **마이크로서비스 분리**
   - LLM 서비스 독립
   - 파일 처리 서비스 독립

---

## 🎯 결론

이번 리팩토링을 통해:
- ✅ **코드 중복 제거**: 반복되는 패턴을 재사용 가능한 함수로 추출
- ✅ **가독성 향상**: 매직 넘버 제거, 명확한 함수명 사용
- ✅ **유지보수성 개선**: 관심사 분리, 단일 책임 원칙 준수
- ✅ **확장성 확보**: 새로운 기능 추가가 쉬워짐

**전체적으로 코드 품질이 크게 향상되었으며, 향후 개발 속도와 안정성이 개선될 것으로 예상됩니다.**

---

*리팩토링 완료: 2025년 11월 17일*

