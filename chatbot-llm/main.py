import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage, AIMessage
import requests
import json

# 환경 변수 로드
load_dotenv()

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 출처 허용 (보안상 필요하면 특정 도메인만 허용)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 모델 정의
class Message(BaseModel):
    role: str
    content: str

# AI 설정 모델 추가
class AiSettings(BaseModel):
    personalityType: str = "친근함"
    speechStyle: str = "반말" 
    emojiUsage: int = 3
    empathyLevel: int = 3
    nickname: Optional[str] = None
    memoryPriorities: Dict[str, int] = {}
    userProfile: Dict[str, Any] = {}
    avoidTopics: List[str] = []

class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 1000
    aiSettings: Optional[AiSettings] = None  # 🔥 핵심: AI 설정 추가

# 응답 모델 정의
class Choice(BaseModel):
    message: Message
    finish_reason: str = "stop"
    index: int = 0

class ChatResponse(BaseModel):
    choices: List[Choice]
    model: str
    usage: Dict[str, int]

# OpenAI API 키 확인
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")

# ChatOpenAI 모델 초기화
chat_model = ChatOpenAI(
    openai_api_key=openai_api_key,
    model_name="gpt-4o",
    temperature=0.7,
)

# 백엔드에서 AI 설정 가져오기
def get_ai_settings(user_id: str):
    try:
        backend_url = os.getenv("BACKEND_URL", "http://localhost:8080")
        response = requests.get(f"{backend_url}/ai-settings", 
                              headers={"User-ID": user_id})
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"AI 설정 가져오기 실패: {e}")
    
    # 기본 설정 반환
    return {
        "personalityType": "친근함",
        "speechStyle": "반말",
        "emojiUsage": 3,
        "empathyLevel": 3,
        "memoryRetentionDays": 90,
        "userProfile": {"interests": [], "currentGoals": []},
        "nickname": ""
    }

# 🔥 핵심: AI 설정 기반 시스템 프롬프트 생성
def create_personalized_system_prompt(settings: AiSettings) -> str:
    personality = settings.personalityType
    speech_style = settings.speechStyle
    emoji_usage = settings.emojiUsage
    nickname = settings.nickname if settings.nickname else "친구"
    
    # 말투 강제 적용을 위한 명확한 지시
    speech_instruction = ""
    if speech_style == "반말":
        speech_instruction = """
⚠️ 중요: 반드시 반말로만 대화하세요!
- "안녕하세요" ❌ → "안녕!" ✅
- "어떻게 지내시나요?" ❌ → "어떻게 지내?" ✅  
- "도움이 되었기를 바랍니다" ❌ → "도움이 됐으면 좋겠어" ✅
- "감사합니다" ❌ → "고마워" ✅
"""
    else:
        speech_instruction = """
⚠️ 중요: 반드시 격식체(존댓말)로만 대화하세요!
- "안녕!" ❌ → "안녕하세요" ✅
- "어떻게 지내?" ❌ → "어떻게 지내시나요?" ✅
"""
    
    # 성격별 구체적 지시
    personality_instruction = ""
    if personality == "친근함":
        personality_instruction = "매우 친근하고 편안한 톤으로, 마치 오랜 친구와 대화하듯이"
    elif personality == "차분함":
        personality_instruction = "차분하고 안정적인 톤으로, 신중하게"
    elif personality == "활발함":
        personality_instruction = "밝고 에너지 넘치는 톤으로, 긍정적이고 활기차게"
    elif personality == "따뜻함":
        personality_instruction = "따뜻하고 포근한 톤으로, 위로가 되도록"
    
    # 이모티콘 지시
    emoji_instruction = ""
    if emoji_usage >= 4:
        emoji_instruction = "이모티콘을 자주 사용해서 감정을 풍부하게 표현하세요. (예: 😊, 😢, 🎉, 💕, 👍 등)"
    elif emoji_usage >= 3:
        emoji_instruction = "이모티콘을 적당히 사용해서 감정을 표현하세요."
    elif emoji_usage <= 2:
        emoji_instruction = "이모티콘 사용을 최소화하세요."

    system_prompt = f"""
당신은 '{nickname}'의 AI 친구 '루나'입니다.

{speech_instruction}

🎭 성격: {personality_instruction} 대화하세요.

😊 이모티콘: {emoji_instruction}

💬 대화 예시:
사용자: "오늘 힘든 일이 있었어"
{speech_style} 응답: "{"어떤 일이었어? 힘들었구나 😢 이야기 들어줄게" if speech_style == "반말" else "어떤 일이 있으셨나요? 힘드셨겠어요 😢 이야기 들어드릴게요"}"

⚠️ 절대 지켜야 할 규칙:
1. {speech_style}을 절대 바꾸지 마세요
2. {personality} 성격을 일관되게 유지하세요  
3. 진짜 친구처럼 개인적이고 따뜻하게 대화하세요
4. 단답형보다는 관심을 보이며 대화를 이어가세요

지금부터 {nickname}와 {speech_style}로 {personality} 성격으로 대화를 시작합니다!
"""
    
    return system_prompt

@app.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    try:
        print(f"🔥 받은 요청: {request.model_dump()}")
        
        # AI 설정 확인
        if request.aiSettings:
            print(f"✅ AI 설정 받음: {request.aiSettings.model_dump()}")
            system_prompt = create_personalized_system_prompt(request.aiSettings)
        else:
            print("❌ AI 설정 없음 - 기본 프롬프트 사용")
            system_prompt = "당신은 도움이 되는 AI 친구 루나입니다."
        
        print(f"📝 시스템 프롬프트 (앞부분):\n{system_prompt[:200]}...")
        
        # 메시지 변환
        messages = [SystemMessage(content=system_prompt)]
        
        for msg in request.messages:
            if msg.role == "system":
                continue
            elif msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        print(f"📨 총 메시지 수: {len(messages)}")
        
        # LLM 호출
        response = chat_model.invoke(messages)
        
        print(f"🤖 생성된 응답: {response.content}")
        
        return ChatResponse(
            choices=[
                Choice(
                    message=Message(
                        role="assistant",
                        content=response.content
                    )
                )
            ],
            model=request.model,
            usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
        )
    except Exception as e:
        print(f"❌ 오류: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3002))
    uvicorn.run(app, host="0.0.0.0", port=port)