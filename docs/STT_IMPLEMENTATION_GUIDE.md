# 🎙️ STT (Speech-to-Text) 구현 가이드

## 📋 목차
1. [개요](#개요)
2. [구현된 기능](#구현된-기능)
3. [파일 구조](#파일-구조)
4. [주요 컴포넌트](#주요-컴포넌트)
5. [사용 방법](#사용-방법)
6. [브라우저 지원](#브라우저-지원)
7. [문제 해결](#문제-해결)

---

## 개요

Web Speech API를 사용하여 음성 인식(STT) 기능을 구현했습니다. 사용자는 마이크를 통해 음성으로 메시지를 입력할 수 있으며, 실시간으로 인식 결과를 확인할 수 있습니다.

### 기술 스택
- **Web Speech API**: 브라우저 내장 음성 인식 API
- **React Hooks**: 상태 관리 및 생명주기 관리
- **TypeScript**: 타입 안정성 보장

---

## 구현된 기능

### ✅ 핵심 기능
1. **실시간 음성 인식**
   - 마이크 버튼 클릭으로 음성 인식 시작/중지
   - 실시간 중간 결과(interim results) 표시
   - 최종 인식 결과를 입력창에 자동 추가

2. **다국어 지원**
   - 한국어, 영어, 일본어, 중국어, 스페인어, 프랑스어 지원
   - 설정에서 언어 선택 가능

3. **연속 인식 모드**
   - 말을 멈춰도 계속 인식 (옵션)
   - 자동 전송 기능 (옵션)

4. **시각적 피드백**
   - 인식 중일 때 빨간색 애니메이션 효과
   - 중간 인식 결과 툴팁 표시
   - 에러 메시지 표시

5. **설정 관리**
   - AI 설정 모달에서 STT 옵션 조정
   - 활성화/비활성화 토글
   - 테스트 기능 제공

---

## 파일 구조

```
chatbot-frontend/src/
├── hooks/
│   └── useSTT.ts                          # STT 커스텀 훅
├── components/
│   ├── ChatInput.tsx                      # 마이크 버튼 통합
│   ├── AiSettingsModal.tsx                # STT 탭 추가
│   └── ai-settings/
│       ├── SettingsTabs.tsx               # 탭 네비게이션 (STT 탭 추가)
│       └── STTSettings.tsx                # STT 설정 컴포넌트
└── types/
    └── speech-recognition.d.ts            # Web Speech API 타입 정의
```

---

## 주요 컴포넌트

### 1. `useSTT` 커스텀 훅

**위치**: `src/hooks/useSTT.ts`

**기능**:
- Web Speech API 초기화 및 관리
- 음성 인식 시작/중지/리셋
- 인식 결과 및 에러 상태 관리

**주요 API**:
```typescript
const {
  start,              // 음성 인식 시작
  stop,               // 음성 인식 중지
  reset,              // 트랜스크립트 초기화
  isListening,        // 인식 중 여부
  transcript,         // 최종 인식 결과
  interimTranscript,  // 중간 인식 결과
  isSupported,        // 브라우저 지원 여부
  error,              // 에러 메시지
} = useSTT({
  language: "ko-KR",
  continuous: true,
  interimResults: true,
});
```

**주요 이벤트 핸들러**:
- `onstart`: 인식 시작 시
- `onresult`: 인식 결과 수신 시
- `onerror`: 에러 발생 시
- `onend`: 인식 종료 시

### 2. `ChatInput` 컴포넌트

**위치**: `src/components/ChatInput.tsx`

**변경 사항**:
- 마이크 버튼 추가 (Mic/MicOff 아이콘)
- STT 훅 통합
- 인식 결과를 입력창에 자동 반영
- 인식 중 시각적 피드백 (빨간색 테두리, 애니메이션)
- 중간 결과 툴팁 표시
- 에러 메시지 표시

**UI 특징**:
```tsx
{/* STT 버튼 */}
{sttSupported && (
  <button
    onClick={handleSTTClick}
    className={isListening ? "bg-red-500 animate-pulse" : ""}
  >
    {isListening ? <MicOff /> : <Mic />}
  </button>
)}
```

### 3. `STTSettings` 컴포넌트

**위치**: `src/components/ai-settings/STTSettings.tsx`

**기능**:
- STT 활성화/비활성화 토글
- 언어 선택 (한국어, 영어, 일본어 등)
- 연속 인식 모드 설정
- 자동 전송 옵션
- 음성 인식 테스트 버튼
- 브라우저 지원 확인 및 안내

**설정 옵션**:
```typescript
interface STTSettingsProps {
  settings: {
    sttEnabled: boolean;      // STT 활성화
    sttLanguage: string;      // 인식 언어
    sttContinuous: boolean;   // 연속 인식
    sttAutoSend: boolean;     // 자동 전송
  };
}
```

### 4. 타입 정의

**위치**: `src/types/speech-recognition.d.ts`

**내용**:
- `SpeechRecognition` 인터페이스
- `SpeechRecognitionEvent` 인터페이스
- `SpeechRecognitionErrorEvent` 인터페이스
- `SpeechRecognitionResult` 관련 타입들
- `Window` 인터페이스 확장

---

## 사용 방법

### 1. 기본 사용법

1. **채팅 입력창에서 마이크 버튼 클릭**
   - 파일 업로드 버튼 옆에 마이크 아이콘이 표시됩니다
   - 브라우저가 지원하지 않으면 버튼이 표시되지 않습니다

2. **마이크 권한 허용**
   - 처음 사용 시 브라우저에서 마이크 권한 요청
   - "허용" 클릭

3. **음성으로 말하기**
   - 마이크 버튼이 빨간색으로 변하고 애니메이션 효과
   - 말하는 내용이 실시간으로 툴팁에 표시됨
   - 최종 인식 결과가 입력창에 자동으로 추가됨

4. **인식 중지**
   - 마이크 버튼을 다시 클릭하여 중지

### 2. 설정 변경

1. **AI 설정 모달 열기**
   - 우측 상단의 설정 아이콘 클릭

2. **"🎙️ 음성 입력" 탭 선택**

3. **원하는 옵션 조정**
   - 음성 입력 기능 활성화/비활성화
   - 인식 언어 선택
   - 연속 인식 모드 설정
   - 자동 전송 옵션 설정

4. **테스트**
   - "음성 인식 테스트" 버튼으로 설정 확인

---

## 브라우저 지원

### ✅ 지원 브라우저
- **Chrome/Chromium**: 완전 지원 (권장)
- **Edge**: 완전 지원
- **Safari**: 부분 지원 (iOS 14.5+)
- **Opera**: 완전 지원

### ❌ 미지원 브라우저
- **Firefox**: Web Speech API 미지원
- **Internet Explorer**: 미지원

### 브라우저별 특징

#### Chrome/Edge (권장)
- 가장 안정적인 인식 성능
- 모든 언어 지원
- 연속 인식 모드 완벽 지원

#### Safari
- iOS 14.5 이상에서 지원
- 일부 언어만 지원
- 연속 인식 모드 제한적

### 권한 관리

**마이크 권한 확인**:
1. Chrome: `chrome://settings/content/microphone`
2. Edge: `edge://settings/content/microphone`
3. Safari: 설정 > Safari > 웹사이트 > 마이크

**권한 거부 시**:
- 브라우저 설정에서 마이크 권한을 수동으로 허용해야 합니다
- 페이지를 새로고침하여 다시 시도

---

## 문제 해결

### 1. 마이크 버튼이 보이지 않음

**원인**:
- 브라우저가 Web Speech API를 지원하지 않음

**해결**:
- Chrome, Edge, Safari 등 지원 브라우저 사용
- 브라우저를 최신 버전으로 업데이트

### 2. "마이크 권한이 거부되었습니다" 에러

**원인**:
- 브라우저에서 마이크 권한을 거부함

**해결**:
1. 브라우저 주소창의 자물쇠 아이콘 클릭
2. 마이크 권한을 "허용"으로 변경
3. 페이지 새로고침

### 3. "음성이 감지되지 않았습니다" 에러

**원인**:
- 마이크가 제대로 작동하지 않음
- 주변 소음이 너무 큼
- 말을 하지 않고 시간이 지남

**해결**:
- 마이크가 올바르게 연결되었는지 확인
- 시스템 설정에서 마이크 볼륨 확인
- 조용한 환경에서 다시 시도
- 마이크에 가까이 대고 명확하게 말하기

### 4. 인식 결과가 부정확함

**원인**:
- 발음이 불명확함
- 주변 소음
- 인식 언어가 잘못 설정됨

**해결**:
- 설정에서 올바른 언어 선택
- 명확하게 발음하기
- 조용한 환경에서 사용
- 마이크 품질 확인

### 5. 연속 인식이 작동하지 않음

**원인**:
- 브라우저가 연속 인식을 지원하지 않음
- 네트워크 문제

**해결**:
- Chrome 또는 Edge 사용 (권장)
- 네트워크 연결 확인
- 설정에서 연속 인식 모드 활성화 확인

### 6. 인식 중 갑자기 중단됨

**원인**:
- 네트워크 연결 끊김
- 브라우저 제한 (일정 시간 후 자동 중단)

**해결**:
- 네트워크 연결 확인
- 짧은 문장으로 나누어 말하기
- 중단되면 다시 마이크 버튼 클릭

---

## 기술적 세부사항

### Web Speech API 설정

```typescript
recognition.lang = "ko-KR";           // 인식 언어
recognition.continuous = true;        // 연속 인식
recognition.interimResults = true;    // 중간 결과 표시
recognition.maxAlternatives = 1;      // 대안 결과 수
```

### 에러 코드

| 에러 코드 | 설명 | 해결 방법 |
|----------|------|----------|
| `no-speech` | 음성이 감지되지 않음 | 마이크에 가까이 대고 말하기 |
| `audio-capture` | 마이크에 접근할 수 없음 | 마이크 연결 확인 |
| `not-allowed` | 마이크 권한 거부 | 브라우저 설정에서 권한 허용 |
| `network` | 네트워크 오류 | 인터넷 연결 확인 |
| `aborted` | 인식이 중단됨 | 다시 시도 |

### 성능 최적화

1. **메모리 관리**
   - `useEffect` cleanup에서 recognition 인스턴스 정리
   - 컴포넌트 언마운트 시 자동 중지

2. **상태 관리**
   - React state로 인식 상태 관리
   - `useCallback`으로 함수 메모이제이션

3. **에러 처리**
   - 모든 에러 케이스에 대한 사용자 친화적 메시지
   - 자동 복구 시도

---

## 향후 개선 사항

### 계획된 기능
1. **백엔드 STT 통합**
   - OpenAI Whisper API 연동 옵션
   - Google Cloud Speech-to-Text 연동 옵션
   - 더 정확한 인식 결과

2. **고급 기능**
   - 음성 명령어 인식 (예: "전송", "취소")
   - 구두점 자동 추가
   - 화자 구분 (다중 화자)

3. **UI/UX 개선**
   - 음성 파형 시각화
   - 인식 신뢰도 표시
   - 키보드 단축키 지원

4. **접근성 향상**
   - 스크린 리더 지원 강화
   - 키보드 네비게이션 개선

---

## 참고 자료

- [MDN Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Web Speech API Specification](https://wicg.github.io/speech-api/)
- [Can I Use - Speech Recognition](https://caniuse.com/speech-recognition)

---

## 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

---

**구현 완료일**: 2025-11-19  
**버전**: 1.0.0  
**작성자**: AI Chatbot Development Team

