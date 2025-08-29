# AI Chatbot Frontend

AI 친구와 대화할 수 있는 채팅 애플리케이션의 프론트엔드입니다. Next.js 13+ App Router를 기반으로 구축되었으며, 실시간 채팅, 테마 커스터마이징, 목표 관리 등의 기능을 제공합니다.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, 또는 bun

### Installation

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 🏗️ 아키텍처 개요

### 폴더 구조

```
chatbot-frontend/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   ├── page.tsx           # 홈페이지
│   │   ├── providers.tsx      # 전역 프로바이더
│   │   ├── globals.css        # 전역 스타일
│   │   ├── chat/[userId]/     # 채팅 페이지 (동적 라우팅)
│   │   ├── login/             # 로그인 페이지
│   │   ├── register/          # 회원가입 페이지
│   │   └── our-stories/       # 대화 기록 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── Chatbot.tsx        # 메인 채팅 컴포넌트
│   │   ├── ChatWindow.tsx     # 채팅 메시지 표시 영역
│   │   ├── ChatInput.tsx      # 메시지 입력 컴포넌트
│   │   ├── MessageBubble.tsx  # 개별 메시지 버블
│   │   ├── ProfileSidebar.tsx # 프로필 및 설정 사이드바
│   │   ├── ChatListSidebar.tsx # 채팅 목록 사이드바
│   │   ├── goal-management/   # 목표 관리 관련 컴포넌트
│   │   ├── theme/             # 테마 관련 컴포넌트
│   │   └── memory-test/       # 메모리 테스트 컴포넌트
│   ├── hooks/                 # 커스텀 React 훅
│   │   ├── useChat.ts         # 채팅 관리 훅
│   │   ├── useAuth.ts         # 인증 관리 훅
│   │   ├── useTheme.ts        # 테마 관리 훅
│   │   ├── useAiSettings.ts   # AI 설정 관리 훅
│   │   └── useAgentStatus.ts  # 에이전트 상태 관리 훅
│   ├── services/              # API 서비스 레이어
│   │   ├── apiClient.ts       # 중앙집중식 API 클라이언트
│   │   ├── authService.ts     # 인증 관련 API
│   │   ├── chatService.ts     # 채팅 관련 API
│   │   ├── agentService.ts    # 에이전트 관련 API
│   │   └── aiSettingsService.ts # AI 설정 관련 API
│   ├── store/                 # 상태 관리 (Zustand)
│   │   ├── authStore.ts       # 인증 상태 관리
│   │   └── chatStore.ts       # 채팅 상태 관리
│   ├── types/                 # TypeScript 타입 정의
│   ├── utils/                 # 유틸리티 함수
│   ├── lib/                   # 라이브러리 설정
│   ├── styles/                # 스타일 파일
│   ├── auth/                  # 인증 관련 컴포넌트
│   └── data/                  # 정적 데이터
└── public/                    # 정적 파일
```

## 🏛️ 아키텍처 패턴

### 레이어드 아키텍처 (Layered Architecture)

```
┌─────────────────────────────────────┐
│           Presentation Layer        │ ← 컴포넌트 (UI)
├─────────────────────────────────────┤
│           Business Logic Layer      │ ← 커스텀 훅
├─────────────────────────────────────┤
│           Service Layer             │ ← API 서비스
├─────────────────────────────────────┤
│           State Management Layer    │ ← Zustand 스토어
├─────────────────────────────────────┤
│           Data Access Layer         │ ← Axios/HTTP 클라이언트
└─────────────────────────────────────┘
```

### 컴포넌트 구조

- **Container Components**: 비즈니스 로직을 포함 (Chatbot, ChatWindow)
- **Presentational Components**: 순수 UI 컴포넌트 (ChatInput, MessageBubble)
- **Layout Components**: 레이아웃 담당 (ProfileSidebar, ChatListSidebar)

### 상태 관리 패턴

- **Zustand**: 전역 상태 관리 (인증, 채팅)
- **React Query**: 서버 상태 관리 (캐싱, 동기화)
- **Local State**: 컴포넌트별 로컬 상태

## 🔧 기술 스택

### Frontend Framework

- **Next.js 13+**: App Router 기반 SSR/SSG
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장

### Styling

- **Tailwind CSS**: 유틸리티 퍼스트 CSS 프레임워크
- **CSS Variables**: 동적 테마 적용
- **Responsive Design**: 모바일 퍼스트 접근

### State Management

- **Zustand**: 경량 상태 관리 라이브러리
- **React Query**: 서버 상태 관리 및 캐싱
- **React Context**: 테마 및 인증 컨텍스트

### HTTP Client

- **Axios**: HTTP 클라이언트
- **Interceptors**: 요청/응답 인터셉터
- **Error Handling**: 중앙집중식 에러 처리

### UI/UX

- **React Markdown**: 마크다운 렌더링
- **Syntax Highlighting**: 코드 하이라이팅
- **Toast Notifications**: 사용자 알림
- **Modal System**: 모달 관리

## 📋 주요 기능

### 1. 채팅 시스템

- 실시간 메시지 전송/수신
- 대화 목록 관리
- 메시지 히스토리
- 파일 업로드 지원
- 마크다운 렌더링

### 2. 인증 시스템

- JWT 기반 인증
- 자동 토큰 갱신
- 보호된 라우트
- 사용자 프로필 관리

### 3. 테마 시스템

- 동적 테마 변경
- 커스텀 테마 생성
- 테마 프리셋
- 로컬 스토리지 저장

### 4. AI 기능

- AI 설정 관리 (성격, 말투)
- 에이전트 상태 모니터링
- 목표 관리 시스템
- 메모리 테스트 기능

### 5. 목표 관리

- 목표 추출 및 저장
- 진행률 추적
- 마일스톤 생성
- 개인화된 목표 추천

## 🎯 컴포넌트 계층 구조

```
Chatbot (메인 컨테이너)
├── ProfileSidebar (프로필/설정)
├── ChatListSidebar (채팅 목록)
└── Main Chat Area
    ├── ChatWindow (메시지 표시)
    │   ├── ThemeSelector (테마 선택)
    │   └── MessageBubble (개별 메시지)
    └── ChatInput (메시지 입력)
```

## 🔐 보안 및 에러 처리

### 인증 가드

- 라우트별 인증 확인
- 토큰 유효성 검증
- 자동 로그아웃 처리

### 에러 경계

- React Error Boundary
- 전역 에러 처리
- 사용자 친화적 에러 메시지

### API 에러 처리

- HTTP 상태 코드별 처리
- 토스트 알림 시스템
- 재시도 로직

## 📱 반응형 디자인

### 모바일 퍼스트

- Tailwind CSS 반응형 클래스
- 터치 친화적 인터페이스
- 모바일 최적화된 사이드바

### 접근성

- 키보드 네비게이션
- 스크린 리더 지원
- 색상 대비 고려

## 🚀 개발 가이드

### 코드 스타일

- TypeScript 엄격 모드 사용
- ESLint + Prettier 설정
- 컴포넌트별 타입 정의
- JSDoc 주석 작성

### 성능 최적화

- React.memo를 통한 불필요한 리렌더링 방지
- React Query를 통한 서버 상태 캐싱
- 이미지 최적화
- 코드 스플리팅

### 테스트

- 컴포넌트 단위 테스트
- 훅 테스트
- API 모킹
- E2E 테스트

## 📦 배포

### Vercel 배포 (권장)

```bash
npm run build
# Vercel CLI를 통한 배포
vercel --prod
```

### 기타 플랫폼

- Netlify
- AWS Amplify
- Docker 컨테이너

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🔗 관련 링크

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
