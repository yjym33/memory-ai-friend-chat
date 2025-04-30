# Chatbot LLM Server

이 서버는 OpenAI의 ChatGPT API를 사용하여 LangChain을 통해 LLM 기능을 제공합니다.

## 설치 방법

1. 가상환경 생성 및 활성화

```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
.\venv\Scripts\activate  # Windows
```

2. 필요한 패키지 설치

```bash
pip install -r requirements.txt
```

3. 환경 변수 설정
   `.env` 파일을 생성하고 다음 내용을 추가하세요:

```
OPENAI_API_KEY=your-openai-api-key
PORT=3002
```

## 실행 방법

```bash
python main.py
```

서버는 기본적으로 http://localhost:3002 에서 실행됩니다.

## API 엔드포인트

### POST /v1/chat/completions

ChatGPT API와 호환되는 채팅 완성 엔드포인트입니다.

#### 요청 예시

```json
{
  "messages": [
    {
      "role": "system",
      "content": "당신은 도움이 되는 AI 어시스턴트입니다."
    },
    {
      "role": "user",
      "content": "안녕하세요!"
    }
  ],
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

#### 응답 예시

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "안녕하세요! 무엇을 도와드릴까요?"
      },
      "finish_reason": "stop",
      "index": 0
    }
  ],
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```
