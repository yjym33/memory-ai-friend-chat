# 📚 프로젝트 문서

AI-CHATBOT 프로젝트의 상세 문서들을 모아놓은 폴더입니다.

---

## 📋 문서 목록

### 🎤 TTS (Text-to-Speech) 관련

#### 1. [TTS 구현 가이드](./TTS_IMPLEMENTATION_GUIDE.md)

- Web Speech API 기반 TTS 기능 구현
- 사용 방법, 기술 상세, 브라우저 지원 정보

#### 2. [TTS 스피커 아이콘 표시 문제 해결](./TTS_FIX_SUMMARY.md)

- AI 응답 메시지에 스피커 아이콘이 표시되지 않던 문제 해결
- ChatWindow 컴포넌트에 TTS 기능 추가

#### 3. [TTS 정지 버튼 추가](./TTS_STOP_BUTTON_UPDATE.md)

- TTS 재생 중 중단할 수 있는 정지 버튼 추가
- 일시정지 vs 정지 기능 비교

#### 4. [TTS 정지 버튼 깜빡임 문제 해결](./TTS_BUTTON_FLICKER_FIX.md)

- 정지 버튼이 잠깐 보였다가 사라지던 문제 해결
- 타이머 기반에서 이벤트 기반으로 개선

---

### 🎙️ STT (Speech-to-Text) 관련

#### 5. [STT 구현 가이드](./STT_IMPLEMENTATION_GUIDE.md)

- Web Speech API 기반 STT 기능 구현
- 음성 입력, 실시간 인식, 다국어 지원
- 사용 방법, 브라우저 지원, 문제 해결

---

### 🔐 인증 (OAuth) 관련

#### 6. [OAuth 설정 가이드](./OAUTH_설정가이드.md)

- Google 및 Kakao 소셜 로그인 설정 방법
- 환경 변수 설정, 콜백 URL 구성 등

---

### 🔧 리팩토링 관련

#### 7. [리팩토링 요약](./REFACTORING_SUMMARY.md)

- 프론트엔드 및 백엔드 코드 리팩토링 내용
- 반복 코드 제거, 가독성 개선, 유지보수성 향상

---

## 📂 문서 분류

### 기능 구현

- TTS 구현 가이드
- STT 구현 가이드
- OAuth 설정 가이드

### 버그 수정

- TTS 스피커 아이콘 표시 문제 해결
- TTS 정지 버튼 깜빡임 문제 해결

### 기능 개선

- TTS 정지 버튼 추가

### 코드 개선

- 리팩토링 요약

---

## 🔍 빠른 찾기

### TTS 기능이 작동하지 않는다면?

1. [TTS 구현 가이드](./TTS_IMPLEMENTATION_GUIDE.md) - 기본 설정 확인
2. [TTS 스피커 아이콘 표시 문제 해결](./TTS_FIX_SUMMARY.md) - 아이콘 미표시 문제
3. [TTS 정지 버튼 깜빡임 문제 해결](./TTS_BUTTON_FLICKER_FIX.md) - 버튼 깜빡임 문제

### STT 기능이 작동하지 않는다면?

1. [STT 구현 가이드](./STT_IMPLEMENTATION_GUIDE.md) - 설정 확인 및 문제 해결

### 소셜 로그인이 작동하지 않는다면?

1. [OAuth 설정 가이드](./OAUTH_설정가이드.md) - 환경 변수 설정 확인

### 코드 구조를 이해하고 싶다면?

1. [리팩토링 요약](./REFACTORING_SUMMARY.md) - 최근 코드 구조 개선 내용

---

## 📝 문서 업데이트 규칙

- 새로운 기능 추가 시: 해당 기능의 구현 가이드를 작성
- 버그 수정 시: 문제 원인과 해결 방법을 문서화
- 리팩토링 시: 변경 사항과 개선점을 요약

---

**마지막 업데이트**: 2025년 11월 19일
