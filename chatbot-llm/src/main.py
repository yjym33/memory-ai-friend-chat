"""
LLM 서버 메인 애플리케이션
모듈화된 아키텍처로 구현된 LLM 서버의 진입점입니다.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config.settings import settings
from .config.logging import setup_logging, get_logger
from .api.chat_routes import router as chat_router
from .middleware.logging_middleware import LoggingMiddleware
from .services.llm_service import llm_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """애플리케이션 생명주기 관리"""
    # 시작 시 실행
    logger = get_logger(__name__)
    logger.info("🚀 LLM 서버 시작 중...")
    
    # 로깅 설정
    setup_logging()
    logger.info("✅ 로깅 시스템 초기화 완료")
    
    # 서비스 초기화
    logger.info("✅ LLM 서비스 초기화 완료")
    
    yield
    
    # 종료 시 실행
    logger.info("🛑 LLM 서버 종료 중...")
    
    # 메모리 정리
    try:
        llm_service.cleanup_memories()
        logger.info("✅ 메모리 정리 완료")
    except Exception as e:
        logger.error(f"❌ 메모리 정리 실패: {e}")
    
    logger.info("👋 LLM 서버 종료 완료")


def create_app() -> FastAPI:
    """FastAPI 애플리케이션 생성"""
    
    app = FastAPI(
        title="LLM Chat Server",
        description="개인화된 AI 친구 채팅 서버",
        version="1.0.0",
        lifespan=lifespan
    )
    
    # CORS 미들웨어 설정
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=settings.cors_allow_methods,
        allow_headers=settings.cors_allow_headers,
    )
    
    # 로깅 미들웨어 추가
    app.add_middleware(LoggingMiddleware)
    
    # 라우터 등록
    app.include_router(chat_router, prefix="/api")
    
    return app


# 애플리케이션 인스턴스 생성
app = create_app()


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "LLM Chat Server",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    # 개발 서버 실행
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
