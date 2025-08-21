import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP 요청/응답 로깅 미들웨어
 * - 모든 HTTP 요청과 응답을 로깅
 * - 응답 시간, 상태 코드, 사용자 정보 등을 기록
 * - 개발 및 디버깅, 모니터링에 유용
 */
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';

    // 요청 로깅
    this.logger.log(`⬅️  ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    // 응답 완료 시 로깅
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;

      // 상태 코드에 따른 로그 레벨 결정
      const logLevel = this.getLogLevel(statusCode);
      const emoji = this.getStatusEmoji(statusCode);

      const logMessage = `${emoji} ${method} ${originalUrl} - ${statusCode} - ${duration}ms - ${ip}`;

      const logMeta = {
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip,
        userAgent,
        timestamp: new Date().toISOString(),
      };

      switch (logLevel) {
        case 'error':
          this.logger.error(logMessage, logMeta);
          break;
        case 'warn':
          this.logger.warn(logMessage, logMeta);
          break;
        case 'log':
        default:
          this.logger.log(logMessage, logMeta);
          break;
      }
    });

    // 요청 처리 중 에러 발생 시 로깅
    res.on('error', (error) => {
      const duration = Date.now() - startTime;
      this.logger.error(
        `💥 ${method} ${originalUrl} - Error after ${duration}ms`,
        error.stack,
        {
          method,
          url: originalUrl,
          duration,
          ip,
          userAgent,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        },
      );
    });

    next();
  }

  /**
   * HTTP 상태 코드에 따른 로그 레벨 결정
   */
  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return 'error'; // 서버 오류
    } else if (statusCode >= 400) {
      return 'warn'; // 클라이언트 오류
    }
    return 'log'; // 성공 및 기타
  }

  /**
   * HTTP 상태 코드에 따른 이모지 반환
   */
  private getStatusEmoji(statusCode: number): string {
    if (statusCode >= 500) {
      return '🔥'; // 서버 오류
    } else if (statusCode >= 400) {
      return '⚠️'; // 클라이언트 오류
    } else if (statusCode >= 300) {
      return '↩️'; // 리다이렉트
    } else if (statusCode >= 200) {
      return '✅'; // 성공
    }
    return '➡️'; // 기타
  }
}
