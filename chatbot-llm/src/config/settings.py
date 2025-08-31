"""
애플리케이션 설정 관리 모듈
환경변수, 기본값, 설정 검증을 담당합니다.
"""

import os
from typing import List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """애플리케이션 설정 클래스"""
    
    # 서버 설정
    host: str = "0.0.0.0"
    port: int = 3002
    debug: bool = False
    
    # OpenAI 설정
    openai_api_key: str
    openai_model: str = "gpt-4o"
    openai_temperature: float = 0.7
    openai_max_tokens: int = 1000
    
    # 백엔드 설정
    backend_url: str = "http://localhost:8080"
    
    # CORS 설정
    cors_origins: List[str] = ["*"]
    cors_allow_credentials: bool = True
    cors_allow_methods: List[str] = ["*"]
    cors_allow_headers: List[str] = ["*"]
    
    # 로깅 설정
    log_level: str = "INFO"
    log_file: str = "logs/llm_server.log"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # 메모리 설정
    max_conversation_history: int = 50
    memory_retention_days: int = 30
    short_term_memory_size: int = 10
    
    # 성능 설정
    request_timeout: int = 30
    max_concurrent_requests: int = 100
    
    @validator("openai_api_key")
    def validate_openai_api_key(cls, v):
        if not v:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다.")
        return v
    
    @validator("log_level")
    def validate_log_level(cls, v):
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"유효하지 않은 로그 레벨입니다: {v}")
        return v.upper()
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# 전역 설정 인스턴스
settings = Settings()
