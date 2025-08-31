"""
로깅 미들웨어
요청/응답 로깅과 성능 모니터링을 제공합니다.
"""

import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from ..config.logging import get_logger, access_logger, performance_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """로깅 미들웨어 클래스"""
    
    def __init__(self, app, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or ["/health", "/favicon.ico"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """요청/응답 처리 및 로깅"""
        
        # 제외할 경로인지 확인
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        start_time = time.time()
        
        # 요청 정보 로깅
        self._log_request(request)
        
        try:
            # 다음 미들웨어/라우트 호출
            response = await call_next(request)
            
            # 응답 정보 로깅
            self._log_response(request, response, start_time)
            
            return response
            
        except Exception as e:
            # 에러 로깅
            self._log_error(request, e, start_time)
            raise
    
    def _log_request(self, request: Request):
        """요청 로깅"""
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        access_logger.info(
            f"요청 시작 - "
            f"메서드: {request.method}, "
            f"경로: {request.url.path}, "
            f"클라이언트 IP: {client_ip}, "
            f"User-Agent: {user_agent[:100]}"
        )
    
    def _log_response(self, request: Request, response: Response, start_time: float):
        """응답 로깅"""
        execution_time = time.time() - start_time
        
        # 성능 로깅
        if execution_time > 1.0:  # 1초 이상 걸린 요청
            performance_logger.warning(
                f"느린 요청 감지 - "
                f"경로: {request.url.path}, "
                f"실행시간: {execution_time:.2f}초"
            )
        
        access_logger.info(
            f"요청 완료 - "
            f"경로: {request.url.path}, "
            f"상태코드: {response.status_code}, "
            f"실행시간: {execution_time:.3f}초"
        )
    
    def _log_error(self, request: Request, error: Exception, start_time: float):
        """에러 로깅"""
        execution_time = time.time() - start_time
        
        logger.error(
            f"요청 처리 중 에러 발생 - "
            f"경로: {request.url.path}, "
            f"실행시간: {execution_time:.3f}초, "
            f"에러: {str(error)}"
        )
