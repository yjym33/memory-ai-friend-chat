# 🔐 소셜 로그인 설정 가이드

## ⚠️ 현재 상태

OAuth 환경 변수가 설정되지 않아 404 오류가 발생하고 있습니다.

## 🚀 빠른 해결 방법

### 1단계: 환경 변수 확인

`chatbot-backend/.env` 파일에 다음 내용이 추가되었습니다:

```bash
# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth (개발 중 - 실제 키를 받아서 설정하세요)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# Kakao OAuth (개발 중 - 실제 키를 받아서 설정하세요)
KAKAO_CLIENT_ID=
KAKAO_CALLBACK_URL=http://localhost:8080/auth/kakao/callback
```

### 2단계: OAuth 자격 증명 받기

#### 🔵 구글 OAuth 설정

1. **Google Cloud Console 접속**

   - https://console.cloud.google.com/ 방문
   - 프로젝트 선택 또는 생성

2. **OAuth 2.0 클라이언트 ID 생성**

   - 좌측 메뉴: **APIs & Services** → **Credentials**
   - **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Web application**
   - Name: "AI Chatbot" (원하는 이름)

3. **승인된 리디렉션 URI 추가**

   ```
   http://localhost:8080/auth/google/callback
   ```

4. **생성된 정보 복사**

   - **Client ID**: `123456789-abcdefg.apps.googleusercontent.com` 형태
   - **Client Secret**: `GOCSPX-xxxxxxxxxxxxx` 형태

5. **`.env` 파일에 추가**
   ```bash
   GOOGLE_CLIENT_ID=받은_클라이언트_ID
   GOOGLE_CLIENT_SECRET=받은_시크릿
   ```

#### 🟡 카카오 OAuth 설정

1. **카카오 개발자 센터 접속**

   - https://developers.kakao.com/ 방문
   - 로그인 후 **내 애플리케이션**으로 이동

2. **애플리케이션 추가**

   - **애플리케이션 추가하기** 클릭
   - 앱 이름: "AI Chatbot" (원하는 이름)
   - 사업자명 입력

3. **플랫폼 설정**

   - 생성한 앱 선택
   - **플랫폼** → **Web 플랫폼 등록**
   - 사이트 도메인: `http://localhost:8080`

4. **카카오 로그인 활성화**

   - **카카오 로그인** → **활성화 설정**의 상태를 ON
   - **Redirect URI** 등록:
     ```
     http://localhost:8080/auth/kakao/callback
     ```

5. **동의 항목 설정**

   - **카카오 로그인** → **동의 항목**
   - **프로필 정보 (닉네임/프로필 사진)**: 필수 동의
   - **카카오계정(이메일)**: 필수 동의

6. **REST API 키 복사**

   - **앱 설정** → **앱 키**
   - **REST API 키** 복사

7. **`.env` 파일에 추가**
   ```bash
   KAKAO_CLIENT_ID=받은_REST_API_키
   ```

### 3단계: 백엔드 서버 재시작

환경 변수를 설정한 후 **반드시 백엔드 서버를 재시작**해야 합니다:

```bash
cd chatbot-backend
# 현재 실행 중인 서버를 중지 (Ctrl+C)
npm run start:dev
```

### 4단계: 테스트

1. 프론트엔드에서 `http://localhost:3000/login` 접속
2. 구글 또는 카카오 버튼 클릭
3. 정상적으로 소셜 로그인 페이지로 이동하는지 확인

## 🐛 여전히 404 오류가 발생한다면?

### 체크리스트

- [ ] `.env` 파일에 OAuth 설정이 추가되었는지 확인
- [ ] 환경 변수에 빈 값이 아닌 실제 키가 입력되었는지 확인
- [ ] 백엔드 서버를 재시작했는지 확인
- [ ] 백엔드 서버 로그에서 에러 메시지 확인

### 서버 로그 확인

백엔드 서버 실행 시 다음과 같은 메시지가 표시되어야 합니다:

```
🚀 AI Chatbot 서버 시작
📍 환경: DEVELOPMENT
🌐 서버: 0.0.0.0:8080
```

### 라우트 확인

백엔드 서버가 실행되면 다음 엔드포인트가 활성화됩니다:

- `GET http://localhost:8080/auth/google`
- `GET http://localhost:8080/auth/google/callback`
- `GET http://localhost:8080/auth/kakao`
- `GET http://localhost:8080/auth/kakao/callback`

브라우저에서 직접 `http://localhost:8080/auth/google`에 접속해보세요.

- **정상**: 구글 로그인 페이지로 리디렉션
- **404**: 라우트가 등록되지 않음 (서버 재시작 필요)
- **500**: 환경 변수 오류 (서버 로그 확인)

## 📝 임시 테스트용 설정

실제 OAuth 키를 받기 전에 테스트하고 싶다면:

```bash
# ⚠️ 이렇게 하면 여전히 작동하지 않지만,
# 404 대신 OAuth 제공자로의 리다이렉트 시도는 합니다

GOOGLE_CLIENT_ID=test-client-id
GOOGLE_CLIENT_SECRET=test-secret
KAKAO_CLIENT_ID=test-kakao-id
```

하지만 **실제로 로그인이 작동하려면 반드시 진짜 OAuth 자격 증명이 필요합니다**.

## 🎯 다음 단계

1. ✅ 환경 변수 추가 완료
2. 🔲 구글 OAuth 자격 증명 받기
3. 🔲 카카오 OAuth 자격 증명 받기
4. 🔲 `.env` 파일에 실제 키 입력
5. 🔲 백엔드 서버 재시작
6. 🔲 소셜 로그인 테스트

## 💡 참고 사항

- **개발 환경**: 로컬호스트에서만 테스트 가능
- **프로덕션**: HTTPS 필수, 도메인 등록 필요
- **보안**: `.env` 파일은 절대 Git에 커밋하지 마세요!
- **지원**: 각 OAuth 제공자의 개발자 문서를 참고하세요

---

**문제가 계속되면 백엔드 서버 로그를 확인하거나 질문해주세요!** 🚀
