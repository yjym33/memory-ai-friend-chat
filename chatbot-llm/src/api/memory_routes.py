"""
메모리 관리 API 라우트

이 모듈은 사용자 메모리 관리를 담당하는 API 엔드포인트를 제공합니다.
대화 내용을 단기/장기 메모리에 저장하고, 대화 컨텍스트를 관리합니다.

주요 기능:
- 사용자 메시지와 AI 응답을 메모리에 저장
- 대화 컨텍스트 관리
- 메모리 조회 및 검색
- 중요도 기반 메모리 분류 (단기/장기)
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from ..services.memory_service import memory_manager
from ..models.chat_models import Message
from ..config.logging import get_logger
from datetime import datetime

logger = get_logger(__name__)

# API 라우터 생성
router = APIRouter(prefix="/api/v1", tags=["memory"])


class MemoryRequest(BaseModel):
    """
    메모리 저장 요청 모델
    
    Attributes:
        userId: 사용자 고유 ID
        conversationId: 대화 고유 ID (선택사항, 대화별 컨텍스트 관리에 사용)
        userMessage: 사용자가 입력한 메시지
        assistantMessage: AI가 생성한 응답
        importance: 메모리 중요도 (1-10, 기본값: 3)
                   - 1-3: 일반 대화 (단기 메모리만)
                   - 4-6: 중요 정보 (단기 + 선택적 장기)
                   - 7-10: 매우 중요 (단기 + 장기 메모리)
        memoryType: 메모리 타입 (기본값: "conversation")
                   - "conversation": 일반 대화
                   - "user_info": 사용자 정보
                   - "preference": 선호도
                   - "important": 중요한 정보
    """
    userId: str = Field(..., description="사용자 고유 ID")
    conversationId: Optional[str] = Field(None, description="대화 ID (선택사항)")
    userMessage: str = Field(..., description="사용자 메시지")
    assistantMessage: str = Field(..., description="AI 응답")
    importance: int = Field(3, ge=1, le=10, description="메모리 중요도 (1-10)")
    memoryType: str = Field("conversation", description="메모리 타입")


class MemoryResponse(BaseModel):
    """
    메모리 저장 응답 모델
    
    Attributes:
        memoryId: 저장된 메모리의 고유 ID (장기 메모리인 경우)
        stored: 저장 성공 여부
        memoryType: 저장된 메모리 타입
        importance: 저장된 메모리 중요도
    """
    memoryId: str = Field(..., description="메모리 ID (장기 메모리인 경우 고유 ID, 단기 메모리는 'short_term')")
    stored: bool = Field(..., description="저장 성공 여부")
    memoryType: str = Field(..., description="메모리 타입")
    importance: int = Field(..., description="메모리 중요도")


@router.post("/memory", response_model=MemoryResponse)
async def save_memory(request: MemoryRequest):
    """
    메모리 저장 API
    
    사용자 메시지와 AI 응답을 메모리 시스템에 저장합니다.
    중요도에 따라 단기 메모리 또는 장기 메모리에 저장됩니다.
    
    프로세스:
    1. 사용자 메시지를 단기 메모리에 추가
    2. AI 응답을 단기 메모리에 추가
    3. 중요도가 높은 경우 (>= 7) 장기 메모리에도 저장
    4. 대화 컨텍스트 업데이트 (conversationId가 제공된 경우)
    
    Args:
        request: 메모리 저장 요청 (MemoryRequest)
    
    Returns:
        MemoryResponse: 저장 결과
    
    Raises:
        HTTPException: 메모리 저장 실패 시 500 에러
    """
    try:
        logger.info(
            f"메모리 저장 요청 - "
            f"사용자: {request.userId}, "
            f"대화: {request.conversationId or '없음'}, "
            f"중요도: {request.importance}, "
            f"타입: {request.memoryType}"
        )
        
        # 1. 사용자별 메모리 인스턴스 가져오기
        # memory_manager는 사용자별로 독립적인 메모리 인스턴스를 관리합니다
        user_memory = memory_manager.get_user_memory(request.userId)
        
        # 2. 사용자 메시지를 단기 메모리에 저장
        # 단기 메모리는 최근 대화를 빠르게 접근하기 위한 큐 구조입니다
        user_msg = Message(
            role="user",
            content=request.userMessage,
            timestamp=datetime.now()
        )
        user_memory.add_short_term_memory(user_msg, request.importance)
        logger.debug(f"사용자 메시지 저장 완료 - 중요도: {request.importance}")
        
        # 3. AI 응답을 단기 메모리에 저장
        # AI 응답도 대화 흐름을 유지하기 위해 저장합니다
        assistant_msg = Message(
            role="assistant",
            content=request.assistantMessage,
            timestamp=datetime.now()
        )
        user_memory.add_short_term_memory(assistant_msg, request.importance)
        logger.debug(f"AI 응답 저장 완료 - 중요도: {request.importance}")
        
        # 4. 중요도가 높은 경우 장기 메모리에도 저장
        # 장기 메모리는 중요한 정보를 영구적으로 보관합니다
        memory_id = None
        if request.importance >= 7:
            # 사용자 메시지와 AI 응답을 결합하여 장기 메모리에 저장
            combined_content = (
                f"사용자: {request.userMessage}\n"
                f"AI: {request.assistantMessage}"
            )
            
            memory_id = user_memory.add_long_term_memory(
                content=combined_content,
                importance=request.importance,
                memory_type=request.memoryType
            )
            logger.info(
                f"장기 메모리 저장 완료 - "
                f"메모리 ID: {memory_id}, "
                f"중요도: {request.importance}"
            )
        
        # 5. 대화 컨텍스트 업데이트 (conversationId가 제공된 경우)
        # 특정 대화의 메시지 히스토리를 관리하여 컨텍스트 유지
        if request.conversationId:
            # 기존 컨텍스트에 새로운 메시지 추가
            user_memory.update_conversation_context(
                request.conversationId,
                [user_msg, assistant_msg]
            )
            logger.debug(f"대화 컨텍스트 업데이트 완료 - 대화 ID: {request.conversationId}")
        
        # 6. 응답 반환
        # memory_id가 None인 경우 단기 메모리만 저장된 것으로 표시
        return MemoryResponse(
            memoryId=memory_id or "short_term",
            stored=True,
            memoryType=request.memoryType,
            importance=request.importance
        )
        
    except Exception as e:
        # 에러 로깅 및 HTTP 예외 발생
        logger.error(
            f"메모리 저장 실패 - "
            f"사용자: {request.userId}, "
            f"에러: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"메모리 저장에 실패했습니다: {str(e)}"
        )


@router.get("/context")
async def get_context(
    userId: str = Query(..., description="사용자 고유 ID"),
    conversationId: Optional[str] = Query(None, description="대화 ID (선택사항)"),
    limit: int = Query(6, ge=1, le=50, description="최대 조회 메시지 수")
):
    """
    컨텍스트 조회 API
    
    사용자의 대화 컨텍스트를 조회합니다.
    특정 대화의 메시지 히스토리와 메모리 요약을 반환합니다.
    
    Args:
        userId: 사용자 고유 ID (쿼리 파라미터)
        conversationId: 대화 ID (선택사항, 쿼리 파라미터)
        limit: 반환할 최대 메시지 수 (기본값: 6)
    
    Returns:
        dict: 컨텍스트 정보
            - context: 대화 메시지 배열
            - memorySummary: 메모리 요약
            - relevantMemories: 관련 메모리 목록
            - contextLength: 전체 컨텍스트 길이
    
    Raises:
        HTTPException: 컨텍스트 조회 실패 시 500 에러
    """
    try:
        logger.info(
            f"컨텍스트 조회 요청 - "
            f"사용자: {userId}, "
            f"대화: {conversationId or '전체'}, "
            f"제한: {limit}"
        )
        
        # 1. 사용자별 메모리 인스턴스 가져오기
        user_memory = memory_manager.get_user_memory(userId)
        
        # 2. 대화 컨텍스트 가져오기
        context = []
        if conversationId:
            # 특정 대화의 컨텍스트만 가져오기
            context = user_memory.get_conversation_context(conversationId)
            logger.debug(f"대화별 컨텍스트 로드 - 메시지 수: {len(context)}")
        else:
            # 전체 컨텍스트 가져오기 (단기 메모리)
            # 단기 메모리는 최근 대화를 담고 있습니다
            if hasattr(user_memory, 'short_term_memory'):
                context = list(user_memory.short_term_memory)
                logger.debug(f"전체 컨텍스트 로드 - 메시지 수: {len(context)}")
        
        # 3. 최근 메시지만 선택 (메모리 효율성)
        # 너무 많은 메시지를 반환하면 네트워크 부하가 증가합니다
        if len(context) > limit:
            recent_context = context[-limit:]
        else:
            recent_context = context
        
        # 4. 메모리 요약 생성 (선택사항)
        # 사용자의 중요한 메모리를 요약하여 제공
        memory_summary = ""
        if hasattr(user_memory, 'get_memory_summary'):
            try:
                memory_summary = user_memory.get_memory_summary()
            except AttributeError:
                memory_summary = "메모리 요약을 생성할 수 없습니다"
        else:
            # 장기 메모리 개수로 요약 생성
            if hasattr(user_memory, 'long_term_memory'):
                long_term_count = len(user_memory.long_term_memory)
                memory_summary = f"저장된 중요한 기억 {long_term_count}개"
        
        # 5. 관련 메모리 추출 (선택사항)
        # 현재는 빈 배열 반환, 향후 유사도 검색으로 개선 가능
        relevant_memories = []
        if hasattr(user_memory, 'get_relevant_memories'):
            try:
                # 전체 메모리에서 관련 메모리 추출 (쿼리 없음)
                relevant_memories = user_memory.get_relevant_memories("", limit=5)
            except AttributeError:
                relevant_memories = []
        
        # 6. 메시지를 딕셔너리로 변환
        # Message 객체를 JSON 직렬화 가능한 형태로 변환
        context_dicts = []
        for msg in recent_context:
            if hasattr(msg, 'to_dict'):
                # MemoryItem의 경우 to_dict 메서드 사용
                context_dicts.append(msg.to_dict())
            elif isinstance(msg, Message):
                # Message 객체의 경우 직접 변환
                context_dicts.append({
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None
                })
            else:
                # 이미 딕셔너리인 경우
                context_dicts.append(msg)
        
        logger.info(
            f"컨텍스트 조회 완료 - "
            f"반환 메시지 수: {len(context_dicts)}, "
            f"전체 컨텍스트 길이: {len(context)}"
        )
        
        # 7. 응답 반환
        return {
            "context": context_dicts,
            "memorySummary": memory_summary,
            "relevantMemories": relevant_memories,
            "contextLength": len(context)
        }
        
    except Exception as e:
        logger.error(
            f"컨텍스트 조회 실패 - "
            f"사용자: {userId}, "
            f"에러: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail=f"컨텍스트 조회에 실패했습니다: {str(e)}"
        )

