"""
프롬프트 생성 API 라우트

이 모듈은 개인화된 AI 프롬프트 생성을 담당하는 API 엔드포인트를 제공합니다.
백엔드에서 사용자 설정과 메모리를 기반으로 최적화된 프롬프트를 생성합니다.

주요 기능:
- AI 설정 기반 시스템 프롬프트 생성
- 사용자 메모리 통합
- 대화 컨텍스트 통합
- 관련 메모리 추출
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel, Field
from ..models.chat_models import AiSettings, Message
from ..services.memory_service import memory_manager
from ..utils.prompt_builder import prompt_builder
from ..config.logging import get_logger

logger = get_logger(__name__)

# API 라우터 생성 (prefix와 tags를 사용하여 엔드포인트 그룹화)
router = APIRouter(prefix="/api/v1", tags=["prompt"])


class PromptRequest(BaseModel):
    """
    프롬프트 생성 요청 모델
    
    Attributes:
        userId: 사용자 고유 ID
        conversationId: 대화 고유 ID (선택사항, 특정 대화의 컨텍스트를 가져올 때 사용)
        message: 사용자가 입력한 현재 메시지
        aiSettings: AI 성격, 말투, 이모지 사용 등의 설정
        maxContextMessages: 포함할 최대 컨텍스트 메시지 수 (기본값: 6)
    """
    userId: str = Field(..., description="사용자 고유 ID")
    conversationId: Optional[str] = Field(None, description="대화 ID (선택사항)")
    message: str = Field(..., description="사용자 메시지")
    aiSettings: AiSettings = Field(..., description="AI 설정 (성격, 말투 등)")
    maxContextMessages: int = Field(6, ge=1, le=20, description="최대 컨텍스트 메시지 수")


class PromptResponse(BaseModel):
    """
    프롬프트 생성 응답 모델
    
    Attributes:
        systemPrompt: 생성된 개인화된 시스템 프롬프트
        messages: 시스템 프롬프트 + 컨텍스트 메시지 + 현재 메시지를 포함한 완전한 메시지 배열
        contextLength: 포함된 컨텍스트 메시지 수
        memoryIncluded: 메모리가 포함되었는지 여부
        relevantMemories: 현재 메시지와 관련된 중요 메모리 목록 (선택사항)
    """
    systemPrompt: str = Field(..., description="생성된 시스템 프롬프트")
    messages: List[dict] = Field(..., description="완전한 메시지 배열 (system + context + user)")
    contextLength: int = Field(..., description="포함된 컨텍스트 메시지 수")
    memoryIncluded: bool = Field(..., description="메모리 포함 여부")
    relevantMemories: Optional[List[str]] = Field(None, description="관련 중요 메모리 목록")


@router.post("/prompt", response_model=PromptResponse)
async def generate_prompt(request: PromptRequest):
    """
    개인화된 프롬프트 생성 API
    
    이 엔드포인트는 다음을 수행합니다:
    1. 사용자의 메모리 시스템에서 정보를 가져옵니다
    2. 대화 컨텍스트를 가져옵니다 (conversationId가 제공된 경우)
    3. AI 설정과 메모리를 결합하여 개인화된 시스템 프롬프트를 생성합니다
    4. 대화 컨텍스트와 현재 메시지를 포함한 완전한 메시지 배열을 반환합니다
    
    Args:
        request: 프롬프트 생성 요청 (PromptRequest)
    
    Returns:
        PromptResponse: 생성된 프롬프트와 메시지 배열
    
    Raises:
        HTTPException: 프롬프트 생성 실패 시 500 에러
    """
    try:
        logger.info(
            f"프롬프트 생성 요청 - "
            f"사용자: {request.userId}, "
            f"대화: {request.conversationId or '없음'}, "
            f"메시지 길이: {len(request.message)}"
        )
        
        # 1. 사용자별 메모리 인스턴스 가져오기
        # memory_manager는 싱글톤 패턴으로 사용자별 메모리를 관리합니다
        user_memory = memory_manager.get_user_memory(request.userId)
        
        # 2. 대화 컨텍스트 가져오기 (conversationId가 제공된 경우)
        # 대화별로 이전 메시지들을 저장하여 컨텍스트 유지
        conversation_context = None
        if request.conversationId:
            conversation_context = user_memory.get_conversation_context(
                request.conversationId
            )
            logger.debug(
                f"대화 컨텍스트 로드 - 메시지 수: {len(conversation_context) if conversation_context else 0}"
            )
        
        # 3. 개인화된 시스템 프롬프트 생성
        # prompt_builder는 AI 설정과 메모리를 결합하여 최적화된 프롬프트를 생성합니다
        # - AI 성격 (친근함, 차분함 등)
        # - 말투 (반말, 존댓말)
        # - 이모지 사용 빈도
        # - 사용자 프로필 정보
        # - 중요 메모리
        system_prompt = prompt_builder.create_personalized_system_prompt(
            request.aiSettings,
            user_memory,
            conversation_context
        )
        
        logger.debug(f"시스템 프롬프트 생성 완료 - 길이: {len(system_prompt)} 문자")
        
        # 4. 관련 메모리 추출 (선택사항)
        # 현재 메시지와 관련된 중요한 메모리를 추출하여 프롬프트에 포함
        relevant_memories = None
        if user_memory and hasattr(user_memory, 'get_relevant_memories'):
            try:
                relevant_memories = user_memory.get_relevant_memories(
                    request.message,
                    limit=3  # 최대 3개의 관련 메모리만 반환
                )
            except AttributeError:
                # get_relevant_memories 메서드가 아직 구현되지 않은 경우
                logger.debug("get_relevant_memories 메서드를 사용할 수 없습니다")
                relevant_memories = None
        
        # 5. 완전한 메시지 배열 구성
        # LLM에 전송할 수 있는 형태로 메시지 배열을 구성합니다
        messages = []
        
        # 5-1. 시스템 프롬프트 추가 (항상 첫 번째 메시지)
        messages.append({
            "role": "system",
            "content": system_prompt
        })
        
        # 5-2. 대화 컨텍스트 메시지 추가 (최근 N개만)
        # 너무 많은 메시지를 포함하면 토큰 수가 증가하므로 제한을 둡니다
        if conversation_context:
            # 최근 메시지만 선택 (system 메시지는 제외)
            recent_messages = [
                msg for msg in conversation_context[-request.maxContextMessages:]
                if msg.role != "system"
            ]
            
            for msg in recent_messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            logger.debug(f"대화 컨텍스트 추가 - 메시지 수: {len(recent_messages)}")
        
        # 5-3. 현재 사용자 메시지 추가 (항상 마지막)
        messages.append({
            "role": "user",
            "content": request.message
        })
        
        # 6. 컨텍스트 길이 계산 (system과 현재 메시지 제외)
        context_length = len(messages) - 2  # system(1) + current user(1) = 2
        
        logger.info(
            f"프롬프트 생성 완료 - "
            f"총 메시지 수: {len(messages)}, "
            f"컨텍스트 길이: {context_length}, "
            f"메모리 포함: {user_memory is not None}"
        )
        
        # 7. 응답 반환
        return PromptResponse(
            systemPrompt=system_prompt,
            messages=messages,
            contextLength=context_length,
            memoryIncluded=user_memory is not None,
            relevantMemories=relevant_memories
        )
        
    except Exception as e:
        # 에러 로깅 및 HTTP 예외 발생
        logger.error(
            f"프롬프트 생성 실패 - "
            f"사용자: {request.userId}, "
            f"에러: {str(e)}",
            exc_info=True  # 전체 스택 트레이스 포함
        )
        raise HTTPException(
            status_code=500,
            detail=f"프롬프트 생성에 실패했습니다: {str(e)}"
        )

