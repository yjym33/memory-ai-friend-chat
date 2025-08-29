# AI Chatbot Backend

AI 친구와 대화할 수 있는 채팅 애플리케이션의 백엔드입니다. NestJS 프레임워크를 기반으로 구축되었으며, 실시간 채팅, AI 에이전트, 목표 관리, 인증 등의 기능을 제공합니다.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm, yarn, pnpm, 또는 bun

### Environment Variables

`.env` 파일을 생성하고 다음 환경변수를 설정하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=chatbot

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Server
PORT=8080
NODE_ENV=development
```

### Installation

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start:prod
```

서버가 실행되면 [http://localhost:8080](http://localhost:8080)에서 API를 확인할 수 있습니다.

## 🏗️ 아키텍처 개요

### 폴더 구조

```
chatbot-backend/
├── src/
│   ├── main.ts                    # 애플리케이션 진입점
│   ├── app.module.ts              # 루트 모듈
│   ├── app.controller.ts          # 기본 컨트롤러
│   ├── app.service.ts             # 기본 서비스
│   ├── auth/                      # 인증 모듈
│   │   ├── auth.controller.ts     # 인증 컨트롤러
│   │   ├── auth.service.ts        # 인증 서비스
│   │   ├── auth.module.ts         # 인증 모듈
│   │   ├── dto/                   # 데이터 전송 객체
│   │   ├── entity/                # 사용자 엔티티
│   │   └── guards/                # 인증 가드
│   ├── chat/                      # 채팅 모듈
│   │   ├── chat.controller.ts     # 채팅 컨트롤러
│   │   ├── chat.service.ts        # 채팅 서비스
│   │   ├── chat.module.ts         # 채팅 모듈
│   │   └── entity/                # 대화 엔티티
│   ├── agent/                     # AI 에이전트 모듈
│   │   ├── agent.controller.ts    # 에이전트 컨트롤러
│   │   ├── agent.service.ts       # 에이전트 서비스
│   │   ├── agent.module.ts        # 에이전트 모듈
│   │   ├── entities/              # 에이전트 엔티티
│   │   ├── workflows/             # 워크플로우
│   │   └── types/                 # 타입 정의
│   ├── ai-settings/               # AI 설정 모듈
│   │   ├── ai-settings.controller.ts
│   │   ├── ai-settings.service.ts
│   │   ├── ai-settings.module.ts
│   │   └── entity/
│   ├── conversation-analytics/    # 대화 분석 모듈
│   ├── upload/                    # 파일 업로드 모듈
│   ├── users/                     # 사용자 모듈
│   ├── config/                    # 설정 모듈
│   │   ├── database.config.ts     # 데이터베이스 설정
│   │   ├── security.config.ts     # 보안 설정
│   │   ├── logger.config.ts       # 로거 설정
│   │   ├── env.validation.ts      # 환경변수 검증
│   │   └── config.module.ts       # 설정 모듈
│   ├── common/                    # 공통 모듈
│   │   ├── filters/               # 예외 필터
│   │   └── middleware/            # 미들웨어
│   ├── migrations/                # 데이터베이스 마이그레이션
│   └── scripts/                   # 유틸리티 스크립트
├── test/                          # 테스트 파일
├── logs/                          # 로그 파일
└── uploads/                       # 업로드된 파일
```

## 🏛️ 아키텍처 패턴

### 모듈형 아키텍처 (Modular Architecture)

```
┌─────────────────────────────────────┐
│           API Gateway Layer         │ ← 컨트롤러 (라우팅)
├─────────────────────────────────────┤
│           Business Logic Layer      │ ← 서비스 (비즈니스 로직)
├─────────────────────────────────────┤
│           Data Access Layer         │ ← 리포지토리 (데이터 접근)
├─────────────────────────────────────┤
│           Database Layer            │ ← PostgreSQL (데이터 저장)
└─────────────────────────────────────┘
```

### 모듈 구조

- **AuthModule**: 사용자 인증 및 권한 관리
- **ChatModule**: 채팅 및 대화 관리
- **AgentModule**: AI 에이전트 및 목표 관리
- **AiSettingsModule**: AI 설정 관리
- **ConversationAnalyticsModule**: 대화 분석
- **UploadModule**: 파일 업로드 처리

### 의존성 주입 패턴

- **Controller**: HTTP 요청/응답 처리
- **Service**: 비즈니스 로직 캡슐화
- **Repository**: 데이터 접근 추상화
- **Guard**: 인증/인가 처리
- **Interceptor**: 요청/응답 변환
- **Filter**: 예외 처리

## 🔧 기술 스택

### Backend Framework

- **NestJS**: Node.js 기반 엔터프라이즈급 프레임워크
- **TypeScript**: 타입 안전성 보장
- **Express**: HTTP 서버

### Database

- **PostgreSQL**: 관계형 데이터베이스
- **TypeORM**: ORM (Object-Relational Mapping)
- **Migrations**: 데이터베이스 스키마 관리

### Authentication & Security

- **JWT**: JSON Web Token 기반 인증
- **bcrypt**: 비밀번호 해싱
- **CORS**: Cross-Origin Resource Sharing
- **Helmet**: 보안 헤더 설정

### AI & External Services

- **OpenAI API**: GPT 모델 활용
- **Axios**: HTTP 클라이언트

### Logging & Monitoring

- **Winston**: 로깅 라이브러리
- **NestJS Logger**: 프레임워크 로거

### File Processing

- **Multer**: 파일 업로드 처리
- **PDF-Parse**: PDF 파일 파싱
- **Mammoth**: Word 문서 파싱
- **XLSX**: Excel 파일 처리
- **Tesseract.js**: OCR (광학 문자 인식)

## 📋 주요 기능

### 1. 인증 시스템

- JWT 기반 사용자 인증
- 회원가입/로그인 API
- 토큰 검증 및 갱신
- 보호된 라우트 가드

### 2. 채팅 시스템

- 실시간 메시지 처리
- 대화 목록 관리
- 메시지 히스토리 저장
- 파일 업로드 지원 (PDF, Word, Excel, 이미지)

### 3. AI 에이전트

- OpenAI GPT 모델 연동
- 감정 분석 및 추적
- 목표 추출 및 관리
- 개인화된 응답 생성

### 4. 목표 관리

- 목표 추출 및 저장
- 진행률 추적
- 마일스톤 생성
- 개인화된 목표 추천

### 5. AI 설정

- AI 성격 설정
- 말투 및 스타일 관리
- 사용자별 맞춤 설정

### 6. 대화 분석

- 대화 패턴 분석
- 사용자 행동 추적
- 통계 및 인사이트 제공

## 🎯 API 엔드포인트

### 인증 API

```
POST /auth/register     # 회원가입
POST /auth/login        # 로그인
GET  /auth/validate     # 토큰 검증
```

### 채팅 API

```
GET    /chat/conversations              # 대화 목록 조회
POST   /chat/conversations              # 새 대화 생성
GET    /chat/conversations/:id          # 대화 상세 조회
PUT    /chat/conversations/:id          # 대화 업데이트
DELETE /chat/conversations/:id          # 대화 삭제
PUT    /chat/conversations/:id/title    # 대화 제목 변경
PUT    /chat/conversations/:id/pin      # 대화 고정/해제
POST   /chat/completion/:conversationId # AI 응답 생성
POST   /chat/upload                     # 파일 업로드
```

### 에이전트 API

```
GET    /agent/status                    # 에이전트 상태 조회
GET    /agent/goals                     # 목표 목록 조회
POST   /agent/goals                     # 목표 생성
PUT    /agent/goals/:id/progress        # 목표 진행률 업데이트
DELETE /agent/goals/:id                 # 목표 삭제
```

### AI 설정 API

```
GET    /ai-settings                     # AI 설정 조회
PUT    /ai-settings                     # AI 설정 업데이트
```

## 🔐 보안 및 에러 처리

### 인증 가드

- JWT 토큰 검증
- 라우트별 인증 요구사항
- 자동 토큰 갱신

### 글로벌 예외 필터

- HTTP 예외 처리
- 데이터베이스 오류 처리
- 사용자 친화적 에러 메시지
- 개발/프로덕션 환경별 로깅

### 보안 설정

- CORS 정책 설정
- 요청 크기 제한
- 보안 헤더 설정
- SQL 인젝션 방지

## 📊 데이터베이스 스키마

### 주요 엔티티

#### User (사용자)

- id, email, password, name, gender, birthYear
- createdAt, updatedAt

#### Conversation (대화)

- id, userId, title, messages, pinned
- theme, themeName, createdAt, updatedAt

#### Goal (목표)

- id, userId, title, description, category
- status, progress, priority, targetDate
- milestones, lastCheckedAt, completedAt

#### Emotion (감정)

- id, userId, type, intensity, context
- createdAt

#### AiSettings (AI 설정)

- id, userId, personalityType, speechStyle
- memoryPriorities, createdAt, updatedAt

## 🚀 개발 가이드

### 코드 스타일

- TypeScript 엄격 모드 사용
- ESLint + Prettier 설정
- NestJS 컨벤션 준수
- JSDoc 주석 작성

### 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

### 마이그레이션

```bash
# 마이그레이션 생성
npm run migration:generate -- src/migrations/MigrationName

# 마이그레이션 실행
npm run migration:run

# 마이그레이션 되돌리기
npm run migration:revert
```

### 로깅

- Winston을 통한 구조화된 로깅
- 환경별 로그 레벨 설정
- 파일 및 콘솔 로깅
- 에러 추적 및 모니터링

## 📦 배포

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 8080
CMD ["npm", "run", "start:prod"]
```

### 환경별 설정

- **Development**: 개발 환경 설정
- **Production**: 프로덕션 환경 설정
- **Test**: 테스트 환경 설정

### 모니터링

- 로그 모니터링
- 성능 메트릭 수집
- 에러 추적
- 헬스 체크 엔드포인트

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🔗 관련 링크

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
