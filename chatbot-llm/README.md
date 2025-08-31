# Chatbot LLM Server

모듈화된 아키텍처로 구현된 개인화된 AI 친구 채팅 서버입니다.

## 🏗️ 새로운 아키텍처 특징

### **모듈화된 구조**

```
chatbot-llm/
├── src/
│   ├── main.py                 # FastAPI 앱 진입점
│   ├── config/
│   │   ├── settings.py         # 설정 관리
│   │   └── logging.py          # 로깅 설정
│   ├── models/
│   │   └── chat_models.py      # Pydantic 모델
│   ├── services/
│   │   ├── llm_service.py      # LLM 핵심 서비스
│   │   └── memory_service.py   # 메모리 관리
│   ├── utils/
│   │   └── prompt_builder.py   # 프롬프트 생성
│   ├── middleware/
│   │   └── logging_middleware.py # 로깅 미들웨어
│   └── api/
│       └── chat_routes.py      # 채팅 API 라우트
├── tests/
├── logs/                       # 로그 파일
├── run.py                      # 실행 스크립트
└── test_new_llm_server.sh      # 테스트 스크립트
```

### **핵심 기능**

- 🧠 **메모리 시스템**: 단기/장기 메모리와 대화 컨텍스트 관리
- 🎭 **개인화된 AI**: 사용자별 맞춤 성격과 말투 설정
- 📊 **로깅 및 모니터링**: 구조화된 로깅과 성능 추적
- 🔄 **대화 연속성**: 이전 대화 기억과 일관성 유지

## 🚀 설치 및 실행

### 1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
.\venv\Scripts\activate  # Windows
```

### 2. 필요한 패키지 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
OPENAI_API_KEY=your-openai-api-key
PORT=3002
LOG_LEVEL=INFO
DEBUG=false
```

### 4. 서버 실행

```bash
# 새로운 모듈화된 서버 실행
python run.py

# 또는 직접 실행
python -m src.main
```

서버는 기본적으로 http://localhost:3002 에서 실행됩니다.

## 📡 API 엔드포인트

### **채팅 API**

#### POST /api/v1/chat/completions

OpenAI API와 호환되는 채팅 완성 엔드포인트입니다.

**요청 예시:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "안녕하세요!"
    }
  ],
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000,
  "aiSettings": {
    "personalityType": "친근함",
    "speechStyle": "반말",
    "emojiUsage": 3,
    "empathyLevel": 4,
    "nickname": "친구"
  },
  "conversation_id": "conv_123",
  "user_id": "user_456"
}
```

**응답 예시:**

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "안녕! 오늘은 어떤 이야기를 나눠볼까? 😊"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "model": "gpt-4o",
  "usage": {
    "prompt_tokens": 150,
    "completion_tokens": 25,
    "total_tokens": 175
  },
  "conversation_id": "conv_123",
  "memory_updated": true
}
```

### **관리 API**

#### GET /

루트 엔드포인트 - 서버 상태 확인

#### GET /health

헬스 체크 엔드포인트

#### GET /api/stats

서비스 통계 조회 (메모리 사용량 등)

#### POST /api/cleanup

오래된 메모리 정리

## 🧠 메모리 시스템

### **단기 메모리**

- 최근 대화 메시지 저장
- 빠른 접근을 위한 큐 구조
- 설정 가능한 크기 제한

### **장기 메모리**

- 중요한 정보의 영구 저장
- 중요도 기반 관리
- 자동 정리 기능

### **대화 컨텍스트**

- 대화별 메시지 히스토리
- 컨텍스트 기반 응답 생성
- 메모리 효율성 고려

## 🎭 AI 개인화

### **성격 타입**

- 친근함: 편안하고 친근한 톤
- 차분함: 안정적이고 신중한 톤
- 활발함: 밝고 에너지 넘치는 톤
- 따뜻함: 포근하고 위로가 되는 톤

### **말투 설정**

- 반말: 친근하고 편안한 대화
- 존댓말: 정중하고 격식있는 대화

### **이모티콘 사용**

- 1-5 단계로 이모티콘 사용 빈도 조절
- 감정 표현 강화

### **공감 수준**

- 1-5 단계로 공감 표현 강도 조절
- 상황에 맞는 적절한 위로 제공

## 📊 로깅 및 모니터링

### **로그 레벨**

- DEBUG: 상세한 디버깅 정보
- INFO: 일반적인 정보
- WARNING: 경고 메시지
- ERROR: 오류 메시지
- CRITICAL: 심각한 오류

### **로그 파일**

- `logs/llm_server.log`: 메인 로그 파일
- 자동 로테이션 (10MB 단위)
- 최대 5개 백업 파일 유지

### **성능 모니터링**

- 요청/응답 시간 추적
- 느린 요청 자동 감지
- 메모리 사용량 통계

## 🧪 테스트

### **자동화된 테스트 실행**

```bash
chmod +x test_new_llm_server.sh
./test_new_llm_server.sh
```

### **테스트 항목**

1. 헬스 체크 테스트
2. 통계 및 메모리 관리 테스트
3. 기본 채팅 API 테스트
4. 개인화된 채팅 API 테스트
5. 대화 컨텍스트 테스트
6. 메모리 정리 테스트
7. 최종 통계 확인

## 🔧 설정 옵션

### **서버 설정**

- `HOST`: 서버 호스트 (기본값: 0.0.0.0)
- `PORT`: 서버 포트 (기본값: 3002)
- `DEBUG`: 디버그 모드 (기본값: false)

### **OpenAI 설정**

- `OPENAI_API_KEY`: OpenAI API 키 (필수)
- `OPENAI_MODEL`: 사용할 모델 (기본값: gpt-4o)
- `OPENAI_TEMPERATURE`: 창의성 수준 (기본값: 0.7)
- `OPENAI_MAX_TOKENS`: 최대 토큰 수 (기본값: 1000)

### **메모리 설정**

- `MAX_CONVERSATION_HISTORY`: 최대 대화 히스토리 (기본값: 50)
- `MEMORY_RETENTION_DAYS`: 메모리 보존 기간 (기본값: 30)
- `SHORT_TERM_MEMORY_SIZE`: 단기 메모리 크기 (기본값: 10)

### **로깅 설정**

- `LOG_LEVEL`: 로그 레벨 (기본값: INFO)
- `LOG_FILE`: 로그 파일 경로 (기본값: logs/llm_server.log)

## 🚀 향후 개선 계획

### **Phase 2: 감정 인식 시스템**

- 텍스트 기반 감정 분석
- 감정에 따른 응답 조정
- 감정 추적 및 기록

### **Phase 3: 적응형 학습**

- 사용자 패턴 학습
- 성격 적응 시스템
- 피드백 기반 개선

### **Phase 4: 고급 기능**

- 멀티모달 기능 (이미지, 음성)
- 인터랙티브 게임
- 지식 베이스 통합

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
