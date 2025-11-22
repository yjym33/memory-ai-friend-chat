# Claude 모델 404 오류 해결 가이드

## 문제 상황

Claude 모델로 변경 후 호출 시 다음과 같은 404 오류가 발생:

```
Anthropic Claude 스트리밍 API 호출 실패: 404 
{"type":"error","error":{"type":"not_found_error","message":"model: claude-3-sonnet-20240229"}}
```

## 원인 분석

### 1. 모델 이름 문제

`claude-3-sonnet-20240229` 모델이 일부 Anthropic API 환경에서 지원되지 않을 수 있습니다.

**가능한 이유:**
- 모델이 deprecated (더 이상 사용되지 않음)
- API 버전 차이로 인한 지원 불일치
- 지역별 모델 가용성 차이

### 2. Anthropic의 권장 모델

Anthropic은 현재 다음 모델을 권장합니다:
- ✅ `claude-3-5-sonnet-20241022` (최신, 권장)
- ✅ `claude-3-opus-20240229`
- ✅ `claude-3-haiku-20240307`
- ⚠️ `claude-3-sonnet-20240229` (일부 환경에서 지원되지 않을 수 있음)

## 해결 방법

### 1. AI 설정에서 모델 변경

1. **AI 친구 설정 모달 열기**
2. **"🤖 AI 모델" 탭 선택**
3. **Provider: "Anthropic (Claude)" 선택**
4. **모델 선택: "Claude 3.5 Sonnet" 선택** (권장)
   - 또는 "Claude 3 Opus", "Claude 3 Haiku" 선택
5. **저장**

### 2. 코드 수정 사항

#### 사용 가능한 모델 목록 업데이트

**파일**: `chatbot-backend/src/llm/providers/anthropic.provider.ts`

```typescript
getAvailableModels(): string[] {
  return [
    'claude-3-5-sonnet-20241022', // 최신 모델 (권장)
    'claude-3-opus-20240229',
    'claude-3-haiku-20240307',
    // 주의: claude-3-sonnet-20240229는 일부 환경에서 지원되지 않을 수 있음
  ];
}
```

**변경 사항:**
- `claude-3-sonnet-20240229` 제거 또는 주석 처리
- 최신 모델인 `claude-3-5-sonnet-20241022` 우선 배치

#### 모델 검증 강화

**파일**: `chatbot-backend/src/llm/providers/anthropic.provider.ts`

```typescript
// 모델 검증 (요청 전에 확인)
if (!this.validateModel(request.model)) {
  const errorMsg = `지원하지 않는 모델입니다: ${request.model}. ` +
    `사용 가능한 모델: ${this.getAvailableModels().join(', ')}`;
  this.logger.error(`❌ ${errorMsg}`);
  throw new Error(errorMsg);
}
```

#### 404 에러 처리 개선

**파일**: `chatbot-backend/src/llm/providers/anthropic.provider.ts`

```typescript
catch (error) {
  // 404 에러인 경우 모델 이름 문제일 가능성이 높음
  if (error.response?.status === 404) {
    const errorData = error.response.data;
    if (errorData?.error?.message?.includes('model')) {
      const availableModels = this.getAvailableModels();
      const errorMsg = 
        `모델 '${request.model}'을 찾을 수 없습니다. ` +
        `사용 가능한 모델: ${availableModels.join(', ')}. ` +
        `AI 설정에서 다른 모델을 선택해주세요.`;
      throw new Error(errorMsg);
    }
  }
  // ... 기타 에러 처리
}
```

## 확인 방법

### 1. 현재 모델 확인

AI 설정에서 현재 선택된 모델 확인:
- Provider: Anthropic (Claude)
- Model: Claude 3.5 Sonnet (또는 다른 지원되는 모델)

### 2. 백엔드 로그 확인

정상 작동 시:
```
🔄 Anthropic Claude 스트리밍 응답 시작
스트리밍 요청 정보 - 모델: claude-3-5-sonnet-20241022, ...
✅ Anthropic Claude 스트리밍 응답 완료
```

에러 발생 시:
```
❌ 모델 'claude-3-sonnet-20240229'을 찾을 수 없습니다.
사용 가능한 모델: claude-3-5-sonnet-20241022, claude-3-opus-20240229, ...
```

## 예방 조치

### 1. 기본 모델 변경

새 사용자의 기본 모델을 최신 모델로 설정:

**파일**: `chatbot-backend/src/llm/providers/anthropic.provider.ts`

```typescript
getDefaultModel(): string {
  return 'claude-3-5-sonnet-20241022'; // 최신 모델 사용
}
```

### 2. 프론트엔드 모델 목록 업데이트

**파일**: `chatbot-frontend/src/components/ai-settings/ModelSettings.tsx`

```typescript
const AVAILABLE_MODELS: Record<LLMProvider, string[]> = {
  [LLMProvider.ANTHROPIC]: [
    LLMModel.CLAUDE_3_5_SONNET, // 최신 모델을 첫 번째로
    LLMModel.CLAUDE_3_OPUS,
    LLMModel.CLAUDE_3_HAIKU,
    // LLMModel.CLAUDE_3_SONNET, // 주석 처리 또는 제거
  ],
};
```

## 마이그레이션 가이드

기존에 `claude-3-sonnet-20240229`를 사용 중인 사용자를 위해:

1. **기존 모델 사용자 감지**
   - 데이터베이스에서 `llmModel = 'claude-3-sonnet-20240229'`인 사용자 조회
   
2. **자동 업그레이드**
   - 다음 API 호출 시 자동으로 `claude-3-5-sonnet-20241022`로 변경
   - 또는 마이그레이션 스크립트 실행

3. **사용자 알림**
   - 프론트엔드에서 모델 변경 권장 메시지 표시

## 결론

`claude-3-sonnet-20240229` 모델이 일부 Anthropic API 환경에서 지원되지 않으므로:

1. ✅ **권장 모델 사용**: `claude-3-5-sonnet-20241022`
2. ✅ **모델 검증 강화**: 요청 전 모델 지원 여부 확인
3. ✅ **에러 메시지 개선**: 더 명확한 오류 메시지 제공
4. ✅ **모델 목록 업데이트**: 사용 가능한 모델만 제공

이제 AI 설정에서 "Claude 3.5 Sonnet" 모델을 선택하면 정상적으로 작동합니다.

