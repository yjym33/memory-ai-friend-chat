"""
채팅 API 라우트
채팅 관련 엔드포인트를 정의합니다.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from typing import Optional
import uuid
from ..models.chat_models import ChatRequest, ChatResponse, ErrorResponse
from ..services.llm_service import llm_service
from ..config.logging import get_logger, access_logger, error_logger

logger = get_logger(__name__)

router = APIRouter()


def get_user_id(request: Request) -> Optional[str]:
    """요청에서 사용자 ID 추출"""
    # 헤더에서 사용자 ID 가져오기
    user_id = request.headers.get("User-ID")
    if not user_id:
        # Authorization 헤더에서 JWT 토큰 추출 (실제 구현에서는 토큰 검증 필요)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # 여기서는 간단히 토큰을 사용자 ID로 사용
            user_id = auth_header.split(" ")[1][:8]  # 토큰의 첫 8자리
    
    return user_id


@router.post("/v1/chat/completions", response_model=ChatResponse)
async def chat_completion(
    request: ChatRequest,
    http_request: Request = None,
    user_id: Optional[str] = Depends(get_user_id)
):
    """
    채팅 완성 API 엔드포인트
    OpenAI API와 호환되는 형식으로 응답을 제공합니다.
    """
    
    request_id = str(uuid.uuid4())[:8]
    
    try:
        # 접근 로깅
        access_logger.info(
            f"채팅 요청 시작 - "
            f"요청 ID: {request_id}, "
            f"사용자: {user_id}, "
            f"모델: {request.model}, "
            f"메시지 수: {len(request.messages)}"
        )
        
        # 요청 검증
        if not request.messages:
            raise HTTPException(status_code=400, detail="메시지가 비어있습니다.")
        
        # LLM 서비스를 통한 응답 생성
        response = await llm_service.generate_response(request, user_id)
        
        # 접근 로깅
        access_logger.info(
            f"채팅 요청 완료 - "
            f"요청 ID: {request_id}, "
            f"사용자: {user_id}, "
            f"응답 길이: {len(response.choices[0].message.content)}"
        )
        
        return response
        
    except HTTPException:
        # HTTP 예외는 그대로 전달
        raise
    except Exception as e:
        # 기타 예외는 500 에러로 변환
        error_logger.error(
            f"채팅 요청 실패 - "
            f"요청 ID: {request_id}, "
            f"사용자: {user_id}, "
            f"에러: {str(e)}"
        )
        
        raise HTTPException(
            status_code=500,
            detail=f"서버 내부 오류가 발생했습니다. 요청 ID: {request_id}"
        )


@router.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {
        "status": "healthy",
        "service": "llm-server",
        "version": "1.0.0"
    }


@router.get("/stats")
async def get_stats():
    """서비스 통계 엔드포인트"""
    try:
        memory_stats = llm_service.get_memory_stats()
        
        return {
            "status": "success",
            "memory_stats": memory_stats,
            "service": "llm-server"
        }
    except Exception as e:
        logger.error(f"통계 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="통계 조회에 실패했습니다.")


@router.post("/cleanup")
async def cleanup_memories():
    """메모리 정리 엔드포인트"""
    try:
        llm_service.cleanup_memories()
        
        return {
            "status": "success",
            "message": "메모리 정리가 완료되었습니다."
        }
    except Exception as e:
        logger.error(f"메모리 정리 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="메모리 정리에 실패했습니다.")
