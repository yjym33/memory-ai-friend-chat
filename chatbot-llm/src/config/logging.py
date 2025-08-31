"""
로깅 설정 모듈
구조화된 로깅과 모니터링을 제공합니다.
"""

import logging
import logging.handlers
import os
from datetime import datetime
from typing import Optional
from .settings import settings


class CustomFormatter(logging.Formatter):
    """커스텀 로그 포맷터"""
    
    # 색상 코드
    grey = "\x1b[38;21m"
    blue = "\x1b[34;21m"
    yellow = "\x1b[33;21m"
    red = "\x1b[31;21m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    
    # 로그 레벨별 색상 매핑
    COLORS = {
        logging.DEBUG: grey,
        logging.INFO: blue,
        logging.WARNING: yellow,
        logging.ERROR: red,
        logging.CRITICAL: bold_red,
    }
    
    def format(self, record):
        # 로그 레벨에 따른 색상 적용
        color = self.COLORS.get(record.levelno, self.reset)
        
        # 타임스탬프 포맷
        record.timestamp = datetime.fromtimestamp(record.created).strftime('%Y-%m-%d %H:%M:%S')
        
        # 로그 메시지 포맷
        log_format = (
            f"{color}[%(timestamp)s] %(levelname)-8s{self.reset} "
            f"%(name)s:%(lineno)d - %(message)s"
        )
        
        formatter = logging.Formatter(log_format)
        return formatter.format(record)


def setup_logging(
    log_level: Optional[str] = None,
    log_file: Optional[str] = None,
    enable_console: bool = True
) -> logging.Logger:
    """
    로깅 설정을 초기화합니다.
    
    Args:
        log_level: 로그 레벨 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: 로그 파일 경로
        enable_console: 콘솔 로깅 활성화 여부
    
    Returns:
        설정된 로거 인스턴스
    """
    
    # 설정에서 기본값 가져오기
    log_level = log_level or settings.log_level
    log_file = log_file or settings.log_file
    
    # 로그 디렉토리 생성
    log_dir = os.path.dirname(log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    # 루트 로거 설정
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # 기존 핸들러 제거
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # 콘솔 핸들러
    if enable_console:
        console_handler = logging.StreamHandler()
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(CustomFormatter())
        logger.addHandler(console_handler)
    
    # 파일 핸들러 (RotatingFileHandler 사용)
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(getattr(logging, log_level.upper()))
        
        # 파일용 포맷터 (색상 코드 제외)
        file_formatter = logging.Formatter(
            "[%(asctime)s] %(levelname)-8s %(name)s:%(lineno)d - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    지정된 이름의 로거를 반환합니다.
    
    Args:
        name: 로거 이름
    
    Returns:
        로거 인스턴스
    """
    return logging.getLogger(name)


# 성능 모니터링을 위한 로거
performance_logger = get_logger("performance")
error_logger = get_logger("error")
access_logger = get_logger("access")
