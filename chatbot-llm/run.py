#!/usr/bin/env python3
"""
LLM 서버 실행 스크립트
새로운 모듈화된 아키텍처로 구현된 서버를 실행합니다.
"""

import uvicorn
from src.config.settings import settings
from src.config.logging import setup_logging, get_logger

def main():
    """메인 실행 함수"""
    # 로깅 설정
    setup_logging()
    logger = get_logger(__name__)
    
    logger.info("🚀 LLM 서버 시작 중...")
    logger.info(f"📍 서버 주소: http://{settings.host}:{settings.port}")
    logger.info(f"🔧 디버그 모드: {settings.debug}")
    logger.info(f"📝 로그 레벨: {settings.log_level}")
    
    # 서버 실행
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=False  # 커스텀 로깅 미들웨어 사용
    )

if __name__ == "__main__":
    main()
