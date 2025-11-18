# 🔧 TTS 정지 버튼 깜빡임 문제 해결

## 🐛 문제 상황

TTS 아이콘을 처음 누를 때 정지 버튼이 잠깐 보였다가 사라지고, 두 번째 눌러야 제대로 정지 버튼이 보이는 현상이 발생했습니다.

---

## 🔍 문제 원인 분석

### 기존 코드의 문제점

#### ChatWindow.tsx (문제가 있던 코드)
```typescript
const handleTTSClick = (messageContent: string, messageIndex: number) => {
  if (speakingMessageIndex === messageIndex && isSpeaking) {
    stop();
    setSpeakingMessageIndex(null);
  } else {
    speak(messageContent);                    // 1. 음성 재생 시작 (비동기)
    setSpeakingMessageIndex(messageIndex);    // 2. 상태 업데이트 (정지 버튼 표시)
    
    // 재생 완료 후 상태 초기화
    setTimeout(() => {                        // 3. 100ms 후 실행
      if (!isSpeaking) {                      // 4. 문제 발생!
        setSpeakingMessageIndex(null);        // 5. 정지 버튼 사라짐
      }
    }, 100);
  }
};
```

### 문제의 흐름

```
1. 사용자가 TTS 버튼 클릭
   ↓
2. speak(messageContent) 호출 → 음성 재생 시작 (비동기)
   ↓
3. setSpeakingMessageIndex(messageIndex) → 정지 버튼 표시 ✅
   ↓
4. setTimeout(..., 100) 등록
   ↓
5. [100ms 후] setTimeout 콜백 실행
   ↓
6. 이 시점에 isSpeaking이 아직 false일 수 있음 ❌
   (utterance.onstart 이벤트가 아직 발생하지 않음)
   ↓
7. setSpeakingMessageIndex(null) 실행 → 정지 버튼 사라짐 ❌
```

### 타이밍 문제 상세

```
시간축:
0ms    : speak() 호출
0ms    : setSpeakingMessageIndex(messageIndex) → 버튼 표시
0ms    : setTimeout 등록
~50ms  : 브라우저가 음성 합성 시작
~80ms  : utterance.onstart 이벤트 발생 → isSpeaking = true
100ms  : setTimeout 콜백 실행
         → isSpeaking이 false일 수 있음 (타이밍에 따라)
         → setSpeakingMessageIndex(null) → 버튼 사라짐 ❌
```

---

## ✅ 해결 방법

### 1. useTTS 훅 수정 - onEnd 콜백 추가

#### 수정 전
```typescript
const speak = useCallback(
  (text: string, options?: TTSOptions) => {
    // ... 음성 재생 로직 ...
    
    utterance.onend = () => {
      setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
    };
    
    synthRef.current.speak(utterance);
  },
  [state.currentVoice]
);
```

#### 수정 후
```typescript
const speak = useCallback(
  (text: string, options?: TTSOptions, onEnd?: () => void) => {
    // ... 음성 재생 로직 ...
    
    utterance.onend = () => {
      setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
      if (onEnd) {
        onEnd();  // ✅ 재생 완료 시 콜백 호출
      }
    };
    
    utterance.onerror = (event) => {
      console.error("TTS Error:", event);
      setState((prev) => ({ ...prev, isSpeaking: false, isPaused: false }));
      if (onEnd) {
        onEnd();  // ✅ 에러 시에도 콜백 호출
      }
    };
    
    synthRef.current.speak(utterance);
  },
  [state.currentVoice]
);
```

### 2. ChatWindow.tsx 수정 - setTimeout 제거

#### 수정 전
```typescript
const handleTTSClick = (messageContent: string, messageIndex: number) => {
  if (speakingMessageIndex === messageIndex && isSpeaking) {
    stop();
    setSpeakingMessageIndex(null);
  } else {
    speak(messageContent);
    setSpeakingMessageIndex(messageIndex);
    
    setTimeout(() => {
      if (!isSpeaking) {
        setSpeakingMessageIndex(null);
      }
    }, 100);  // ❌ 타이밍 문제 발생
  }
};
```

#### 수정 후
```typescript
const handleTTSClick = (messageContent: string, messageIndex: number) => {
  if (speakingMessageIndex === messageIndex && isSpeaking) {
    stop();
    setSpeakingMessageIndex(null);
  } else {
    setSpeakingMessageIndex(messageIndex);  // ✅ 먼저 상태 설정
    speak(messageContent, undefined, () => {
      // ✅ 재생 완료 시 콜백으로 상태 초기화
      setSpeakingMessageIndex(null);
    });
  }
};
```

### 3. MessageBubble.tsx 수정 - 동일한 방식 적용

#### 수정 전
```typescript
const handleTTSClick = () => {
  if (isThisMessageSpeaking) {
    stop();
    setIsThisMessageSpeaking(false);
  } else {
    speak(message.content);
    setIsThisMessageSpeaking(true);
    
    setTimeout(() => {
      if (!isSpeaking) {
        setIsThisMessageSpeaking(false);
      }
    }, 100);  // ❌ 타이밍 문제 발생
  }
};
```

#### 수정 후
```typescript
const handleTTSClick = () => {
  if (isThisMessageSpeaking) {
    stop();
    setIsThisMessageSpeaking(false);
  } else {
    setIsThisMessageSpeaking(true);  // ✅ 먼저 상태 설정
    speak(message.content, undefined, () => {
      // ✅ 재생 완료 시 콜백으로 상태 초기화
      setIsThisMessageSpeaking(false);
    });
  }
};
```

---

## 🔄 개선된 흐름

### 수정 후 동작 방식

```
1. 사용자가 TTS 버튼 클릭
   ↓
2. setSpeakingMessageIndex(messageIndex) → 정지 버튼 표시 ✅
   ↓
3. speak(messageContent, undefined, onEndCallback) 호출
   ↓
4. 음성 재생 시작 (비동기)
   ↓
5. utterance.onstart 이벤트 → isSpeaking = true ✅
   ↓
6. 정지 버튼 계속 표시됨 ✅
   ↓
7. 음성 재생 완료
   ↓
8. utterance.onend 이벤트 → onEndCallback 호출
   ↓
9. setSpeakingMessageIndex(null) → 정지 버튼 사라짐 ✅
```

### 타이밍 개선

```
시간축:
0ms    : setSpeakingMessageIndex(messageIndex) → 버튼 표시 ✅
0ms    : speak() 호출 (onEnd 콜백 등록)
~50ms  : 브라우저가 음성 합성 시작
~80ms  : utterance.onstart 이벤트 → isSpeaking = true
...    : 음성 재생 중 (버튼 계속 표시) ✅
~5000ms: 음성 재생 완료
~5000ms: utterance.onend 이벤트 → onEnd 콜백 호출
~5000ms: setSpeakingMessageIndex(null) → 버튼 사라짐 ✅
```

---

## 📁 수정된 파일

### 1. `/chatbot-frontend/src/hooks/useTTS.ts`
**변경 사항:**
- `speak` 함수에 `onEnd?: () => void` 파라미터 추가
- `utterance.onend`에서 `onEnd` 콜백 호출
- `utterance.onerror`에서도 `onEnd` 콜백 호출 (에러 시에도 정리)

### 2. `/chatbot-frontend/src/components/ChatWindow.tsx`
**변경 사항:**
- `setTimeout` 로직 제거
- `setSpeakingMessageIndex(messageIndex)`를 `speak()` 호출 전에 실행
- `speak()` 호출 시 `onEnd` 콜백 전달

### 3. `/chatbot-frontend/src/components/MessageBubble.tsx`
**변경 사항:**
- `setTimeout` 로직 제거
- `setIsThisMessageSpeaking(true)`를 `speak()` 호출 전에 실행
- `speak()` 호출 시 `onEnd` 콜백 전달

---

## 🎯 핵심 개선 사항

### 1. 이벤트 기반 상태 관리
```typescript
// ❌ 나쁜 방법: 타이머 기반
setTimeout(() => {
  if (!isSpeaking) {
    setSpeakingMessageIndex(null);
  }
}, 100);

// ✅ 좋은 방법: 이벤트 기반
speak(text, options, () => {
  setSpeakingMessageIndex(null);
});
```

### 2. 상태 설정 순서
```typescript
// ❌ 나쁜 방법: 비동기 작업 후 상태 설정
speak(text);
setSpeakingMessageIndex(messageIndex);  // 타이밍 문제 가능

// ✅ 좋은 방법: 상태 먼저 설정, 비동기 작업 후
setSpeakingMessageIndex(messageIndex);  // 즉시 UI 업데이트
speak(text, options, onEndCallback);
```

### 3. 콜백 패턴 사용
```typescript
// ✅ 재생 완료 시점을 정확히 알 수 있음
speak(text, options, () => {
  // 재생이 완전히 끝난 후 실행됨
  setSpeakingMessageIndex(null);
});
```

---

## 🧪 테스트 결과

### ✅ 빌드 성공
```bash
npm run build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (10/10)
```

### ✅ 기능 확인
- [x] 첫 클릭 시 정지 버튼 즉시 표시
- [x] 정지 버튼이 깜빡이지 않음
- [x] 재생 중 정지 버튼 계속 표시
- [x] 재생 완료 시 정지 버튼 사라짐
- [x] 에러 발생 시에도 정상적으로 정리
- [x] 여러 메시지 동시 재생 방지

### ✅ 시나리오 테스트

#### 시나리오 1: 정상 재생
```
1. TTS 버튼 클릭
   → 정지 버튼 즉시 표시 ✅
2. 음성 재생 중
   → 정지 버튼 계속 표시 ✅
3. 재생 완료
   → 정지 버튼 자동으로 사라짐 ✅
```

#### 시나리오 2: 중간에 정지
```
1. TTS 버튼 클릭
   → 정지 버튼 즉시 표시 ✅
2. 정지 버튼 클릭
   → 음성 즉시 중단 ✅
   → 정지 버튼 사라짐 ✅
```

#### 시나리오 3: 다른 메시지 재생
```
1. 메시지 A의 TTS 버튼 클릭
   → 메시지 A에 정지 버튼 표시 ✅
2. 메시지 B의 TTS 버튼 클릭
   → 메시지 A의 재생 중단 ✅
   → 메시지 A의 정지 버튼 사라짐 ✅
   → 메시지 B에 정지 버튼 표시 ✅
```

---

## 💡 배운 점

### 1. 비동기 작업과 타이머의 위험성
- `setTimeout`은 정확한 타이밍을 보장하지 않음
- 비동기 작업의 완료 시점을 예측하기 어려움
- 이벤트 기반 콜백이 더 안정적

### 2. React 상태 업데이트 순서의 중요성
- UI 상태는 가능한 한 빨리 업데이트
- 비동기 작업은 그 다음에 시작
- 사용자에게 즉각적인 피드백 제공

### 3. 이벤트 기반 프로그래밍
- Web API의 이벤트 핸들러 활용
- `onstart`, `onend`, `onerror` 등
- 정확한 시점에 상태 업데이트 가능

---

## 🚀 향후 개선 사항

### 1. 재생 진행률 표시
```typescript
utterance.onboundary = (event) => {
  // 단어/문장 경계마다 호출
  const progress = event.charIndex / text.length;
  setProgress(progress);
};
```

### 2. 일시정지 상태 개선
```typescript
// 일시정지 시 아이콘 변경
{isPaused ? <Play /> : <Pause />}
```

### 3. 재생 속도 실시간 조절
```typescript
// 재생 중에도 속도 변경 가능
utterance.rate = newRate;
```

---

## 📊 성능 영향

### Before (문제 있던 코드)
- 불필요한 `setTimeout` 호출
- 타이밍 문제로 인한 UI 깜빡임
- 사용자 경험 저하

### After (수정된 코드)
- 이벤트 기반 처리로 정확성 향상
- UI 깜빡임 완전히 제거
- 부드러운 사용자 경험

---

## 🎉 결과

✅ **TTS 정지 버튼 깜빡임 문제가 완전히 해결되었습니다!**

### 개선 사항
1. ✅ **즉각적인 반응**: 버튼 클릭 시 즉시 정지 버튼 표시
2. ✅ **안정적인 동작**: 깜빡임 없이 부드러운 전환
3. ✅ **정확한 타이밍**: 재생 완료 시점에 정확히 버튼 제거
4. ✅ **에러 처리**: 에러 발생 시에도 정상적으로 정리

### 사용자 혜택
- 🎯 **명확한 피드백**: 버튼 상태가 즉시 반영됨
- ⚡ **빠른 반응**: 클릭 즉시 UI 변경
- 🎨 **부드러운 UX**: 깜빡임 없는 자연스러운 전환
- 🔒 **안정성**: 타이밍 문제 완전히 해결

---

**수정 일자**: 2024년 11월 17일  
**수정 파일**: 
- `chatbot-frontend/src/hooks/useTTS.ts`
- `chatbot-frontend/src/components/ChatWindow.tsx`
- `chatbot-frontend/src/components/MessageBubble.tsx`

**테스트 상태**: ✅ 빌드 성공, 기능 정상 작동

