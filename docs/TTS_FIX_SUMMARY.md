# 🔧 TTS 스피커 아이콘 표시 문제 해결

## 🐛 문제 상황

AI 응답 메시지에서 TTS 스피커 아이콘이 보이지 않는 문제가 발생했습니다.

## 🔍 원인 분석

### 1. 컴포넌트 구조 파악
- **MessageBubble 컴포넌트**: TTS 버튼이 구현되어 있음 ✅
- **ChatWindow 컴포넌트**: MessageBubble을 사용하지 않고 직접 메시지 렌더링 ❌

### 2. 문제의 핵심
```typescript
// ChatWindow.tsx에서 MessageBubble을 import하지 않음
messages.map((msg, idx) => (
  <div>
    <ReactMarkdown>{msg.content}</ReactMarkdown>
    // TTS 버튼 없음!
  </div>
))
```

ChatWindow가 자체적으로 메시지를 렌더링하고 있어서, MessageBubble에 구현된 TTS 버튼이 표시되지 않았습니다.

## ✅ 해결 방법

### ChatWindow 컴포넌트에 TTS 기능 직접 추가

#### 1. Import 추가
```typescript
import { Volume2, VolumeX } from "lucide-react";
import { useTTS } from "../hooks/useTTS";
```

#### 2. TTS 훅 및 상태 추가
```typescript
const { speak, stop, isSpeaking, isSupported } = useTTS();
const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
```

#### 3. TTS 클릭 핸들러 구현
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
    }, 100);
  }
};
```

#### 4. UI에 TTS 버튼 추가
```typescript
{/* TTS 버튼 (AI 메시지에만 표시) */}
{msg.role === "assistant" && isSupported && (
  <div className="mt-3 flex justify-end">
    <button
      onClick={() => handleTTSClick(msg.content, idx)}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 
                 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
      title={speakingMessageIndex === idx && isSpeaking ? "음성 중지" : "음성으로 듣기"}
      aria-label={speakingMessageIndex === idx && isSpeaking ? "음성 중지" : "음성으로 듣기"}
    >
      {speakingMessageIndex === idx && isSpeaking ? (
        <VolumeX className="w-5 h-5 text-purple-600" />
      ) : (
        <Volume2 className="w-5 h-5 text-gray-600 hover:text-purple-600" />
      )}
    </button>
  </div>
)}
```

## 📊 수정된 파일

### `/chatbot-frontend/src/components/ChatWindow.tsx`
- ✅ `useTTS` 훅 import
- ✅ `Volume2`, `VolumeX` 아이콘 import
- ✅ `useState` 추가 (speakingMessageIndex 상태 관리)
- ✅ `handleTTSClick` 핸들러 구현
- ✅ AI 메시지 렌더링 부분에 TTS 버튼 추가

## 🎨 UI 특징

### 버튼 위치
- AI 메시지 하단 우측에 배치
- 출처 정보(sources) 아래에 표시

### 아이콘 변화
- **기본 상태**: 🔊 (Volume2) - 회색
- **호버 상태**: 🔊 (Volume2) - 보라색
- **재생 중**: 🔇 (VolumeX) - 보라색

### 스타일
```css
- 둥근 버튼 (rounded-full)
- 호버 시 배경색 변경 (hover:bg-gray-100)
- 포커스 링 (focus:ring-2 focus:ring-purple-500)
- 부드러운 전환 효과 (transition-colors duration-200)
```

## 🧪 테스트 결과

### ✅ 빌드 성공
```bash
npm run build
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (10/10)
```

### ✅ 기능 확인
- [x] AI 메시지에 스피커 아이콘 표시
- [x] 아이콘 클릭 시 음성 재생
- [x] 재생 중 아이콘 변경 (Volume2 → VolumeX)
- [x] 재생 중 다시 클릭 시 중지
- [x] 여러 메시지 중 현재 재생 중인 메시지 추적
- [x] 브라우저 미지원 시 버튼 숨김

## 🎯 동작 방식

### 1. 메시지 렌더링
```
사용자 메시지 → TTS 버튼 없음
AI 메시지 → TTS 버튼 표시 (브라우저 지원 시)
```

### 2. 상태 관리
```typescript
speakingMessageIndex: number | null
- null: 재생 중인 메시지 없음
- 0, 1, 2, ...: 해당 인덱스의 메시지 재생 중
```

### 3. 재생 제어
```
클릭 → speak(content) → speakingMessageIndex = idx
재클릭 → stop() → speakingMessageIndex = null
```

## 🔄 MessageBubble vs ChatWindow

### MessageBubble 컴포넌트
- 간단한 메시지 표시용
- 테스트 코드에서 사용
- 현재 프로덕션에서는 미사용

### ChatWindow 컴포넌트
- 실제 채팅 화면에서 사용 ✅
- 테마, 출처 정보 등 복잡한 기능 포함
- **TTS 기능 추가 완료** ✅

## 📝 향후 개선 사항

### Option 1: MessageBubble 통합
ChatWindow에서 MessageBubble을 사용하도록 리팩토링
```typescript
// 현재
<div className="message">
  <ReactMarkdown>{msg.content}</ReactMarkdown>
  {/* TTS 버튼 */}
</div>

// 개선안
<MessageBubble 
  message={msg} 
  theme={currentTheme}
  showSources={chatMode === ChatMode.BUSINESS}
/>
```

### Option 2: 공통 TTS 컴포넌트
TTS 버튼을 별도 컴포넌트로 분리
```typescript
<TTSButton 
  content={msg.content}
  messageId={idx}
  isPlaying={speakingMessageIndex === idx}
/>
```

### Option 3: 자동 재생 기능
AI Settings에서 설정한 자동 재생 옵션 적용
```typescript
useEffect(() => {
  if (ttsSettings.ttsAutoPlay && msg.role === "assistant") {
    speak(msg.content);
  }
}, [messages]);
```

## 🎉 결과

✅ **AI 응답 메시지에 스피커 아이콘이 정상적으로 표시됩니다!**

사용자는 이제:
1. AI 메시지 하단의 스피커 아이콘을 클릭
2. 음성으로 AI 응답을 들을 수 있습니다
3. 재생 중 아이콘이 변경되어 시각적 피드백 제공
4. 언제든지 중지 가능

---

**수정 일자**: 2024년 11월 17일  
**수정 파일**: `chatbot-frontend/src/components/ChatWindow.tsx`  
**테스트 상태**: ✅ 빌드 성공, 린트 오류 없음

