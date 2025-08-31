"""
채팅 관련 Pydantic 모델들
API 요청/응답 스키마를 정의합니다.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, validator
from datetime import datetime


class Message(BaseModel):
    """채팅 메시지 모델"""
    role: str = Field(..., description="메시지 역할 (user, assistant, system)")
    content: str = Field(..., description="메시지 내용")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="메시지 타임스탬프")
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ['user', 'assistant', 'system']
        if v not in valid_roles:
            raise ValueError(f'유효하지 않은 역할입니다: {v}. 유효한 값: {valid_roles}')
        return v


class AiSettings(BaseModel):
    """AI 설정 모델"""
    personalityType: str = Field(default="친근함", description="AI 성격 타입")
    speechStyle: str = Field(default="반말", description="말투 스타일")
    emojiUsage: int = Field(default=3, ge=1, le=5, description="이모티콘 사용 빈도 (1-5)")
    empathyLevel: int = Field(default=3, ge=1, le=5, description="공감 수준 (1-5)")
    nickname: Optional[str] = Field(default=None, description="사용자 닉네임")
    memoryPriorities: Dict[str, int] = Field(default_factory=dict, description="메모리 우선순위")
    userProfile: Dict[str, Any] = Field(default_factory=dict, description="사용자 프로필")
    avoidTopics: List[str] = Field(default_factory=list, description="피해야 할 주제들")
    
    @validator('personalityType')
    def validate_personality(cls, v):
        valid_personalities = ["친근함", "차분함", "활발함", "따뜻함"]
        if v not in valid_personalities:
            raise ValueError(f'유효하지 않은 성격 타입입니다: {v}')
        return v
    
    @validator('speechStyle')
    def validate_speech_style(cls, v):
        valid_styles = ["반말", "존댓말"]
        if v not in valid_styles:
            raise ValueError(f'유효하지 않은 말투 스타일입니다: {v}')
        return v


class ChatRequest(BaseModel):
    """채팅 요청 모델"""
    messages: List[Message] = Field(..., description="대화 메시지 목록")
    model: str = Field(default="gpt-4o", description="사용할 모델")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="창의성 수준")
    max_tokens: int = Field(default=1000, ge=1, le=4000, description="최대 토큰 수")
    aiSettings: Optional[AiSettings] = Field(default=None, description="AI 설정")
    conversation_id: Optional[str] = Field(default=None, description="대화 ID")
    user_id: Optional[str] = Field(default=None, description="사용자 ID")


class Choice(BaseModel):
    """응답 선택 모델"""
    message: Message = Field(..., description="응답 메시지")
    finish_reason: str = Field(default="stop", description="완료 이유")
    index: int = Field(default=0, description="선택 인덱스")


class Usage(BaseModel):
    """토큰 사용량 모델"""
    prompt_tokens: int = Field(default=0, description="프롬프트 토큰 수")
    completion_tokens: int = Field(default=0, description="완성 토큰 수")
    total_tokens: int = Field(default=0, description="총 토큰 수")


class ChatResponse(BaseModel):
    """채팅 응답 모델"""
    choices: List[Choice] = Field(..., description="응답 선택 목록")
    model: str = Field(..., description="사용된 모델")
    usage: Usage = Field(default_factory=Usage, description="토큰 사용량")
    conversation_id: Optional[str] = Field(default=None, description="대화 ID")
    memory_updated: bool = Field(default=False, description="메모리 업데이트 여부")


class ErrorResponse(BaseModel):
    """에러 응답 모델"""
    error: str = Field(..., description="에러 메시지")
    detail: Optional[str] = Field(default=None, description="상세 에러 정보")
    timestamp: datetime = Field(default_factory=datetime.now, description="에러 발생 시간")
    request_id: Optional[str] = Field(default=None, description="요청 ID")
