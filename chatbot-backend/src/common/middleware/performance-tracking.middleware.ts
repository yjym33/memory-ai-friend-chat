import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PerformanceMetricsService } from '../services/performance-metrics.service';

interface RequestWithTiming extends Request {
  startTime?: number;
  requestId?: string;
}

@Injectable()
export class PerformanceTrackingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceTrackingMiddleware.name);

  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
  ) {}

  use(req: RequestWithTiming, res: Response, next: NextFunction) {
    // 요청 시작 시간 기록
    req.startTime = Date.now();
    req.requestId = this.generateRequestId();

    // 응답 완료 시 메트릭 기록
    res.on('finish', () => {
      this.recordRequestMetrics(req, res);
    });

    // 에러 발생 시 메트릭 기록
    res.on('error', (error) => {
      this.recordErrorMetrics(req, res, error);
    });

    next();
  }

  private recordRequestMetrics(req: RequestWithTiming, res: Response) {
    if (!req.startTime) return;

    const responseTime = Date.now() - req.startTime;
    const success = res.statusCode < 400;
    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';

    // 성능 메트릭 기록
    this.performanceMetricsService.recordRequest(responseTime, success);

    // 에러인 경우 에러 메트릭도 기록
    if (!success) {
      const errorType = this.getErrorType(statusCode);
      this.performanceMetricsService.recordError(errorType);
    }

    // 상세 로그 (느린 요청만)
    if (responseTime > 1000) {
      // 1초 이상
      this.logger.warn(
        `🐌 느린 요청: ${method} ${url} - ${responseTime}ms (${statusCode}) [${req.requestId}]`,
      );
    } else if (responseTime > 500) {
      // 0.5초 이상
      this.logger.debug(
        `⚠️ 지연 요청: ${method} ${url} - ${responseTime}ms (${statusCode}) [${req.requestId}]`,
      );
    }

    // 성공적인 요청은 디버그 레벨로만 로그
    if (success && responseTime <= 500) {
      this.logger.debug(
        `✅ ${method} ${url} - ${responseTime}ms (${statusCode}) [${req.requestId}]`,
      );
    }

    // 특정 엔드포인트별 추가 메트릭
    this.recordEndpointSpecificMetrics(method, url, responseTime, success);
  }

  private recordErrorMetrics(
    req: RequestWithTiming,
    res: Response,
    error: Error,
  ) {
    if (!req.startTime) return;

    const responseTime = Date.now() - req.startTime;
    const method = req.method;
    const url = req.originalUrl || req.url;

    // 에러 메트릭 기록
    this.performanceMetricsService.recordRequest(responseTime, false);
    this.performanceMetricsService.recordError('server_error');

    this.logger.error(
      `❌ 요청 에러: ${method} ${url} - ${responseTime}ms [${req.requestId}]`,
      error.stack,
    );
  }

  private recordEndpointSpecificMetrics(
    method: string,
    url: string,
    responseTime: number,
    success: boolean,
  ) {
    // API 엔드포인트별 분류
    if (url.startsWith('/chat')) {
      // 채팅 관련 메트릭
      if (url.includes('/completion')) {
        // AI 완성 요청은 일반적으로 더 오래 걸림
        if (responseTime > 5000) {
          // 5초 이상
          this.logger.warn(`🤖 AI 응답 지연: ${responseTime}ms`);
        }
      }
    } else if (url.startsWith('/upload')) {
      // 파일 업로드 관련 메트릭
      if (responseTime > 10000) {
        // 10초 이상
        this.logger.warn(`📁 파일 업로드 지연: ${responseTime}ms`);
      }
    } else if (url.startsWith('/auth')) {
      // 인증 관련 메트릭
      if (responseTime > 2000) {
        // 2초 이상
        this.logger.warn(`🔐 인증 처리 지연: ${responseTime}ms`);
      }
    }

    // 데이터베이스 쿼리가 포함된 요청 추정
    if (
      responseTime > 100 &&
      (url.includes('/conversations') ||
        url.includes('/messages') ||
        url.includes('/users'))
    ) {
      // 데이터베이스 쿼리 메트릭으로 기록 (추정)
      this.performanceMetricsService.recordQuery(
        responseTime,
        responseTime > 1000,
      );
    }
  }

  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) {
      return 'server_error';
    } else if (statusCode >= 400) {
      if (statusCode === 401) return 'unauthorized';
      if (statusCode === 403) return 'forbidden';
      if (statusCode === 404) return 'not_found';
      if (statusCode === 429) return 'rate_limit';
      return 'client_error';
    }
    return 'unknown';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 캐시 성능 추적 데코레이터
 */
export function TrackCachePerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    let cacheHit = false;

    try {
      const result = await method.apply(this, args);

      // 결과가 캐시에서 온 것인지 확인 (구현에 따라 다름)
      if (result && typeof result === 'object' && result._fromCache) {
        cacheHit = true;
      }

      return result;
    } finally {
      const responseTime = Date.now() - startTime;

      // 성능 메트릭 서비스가 있다면 기록
      if (this.performanceMetricsService) {
        if (cacheHit) {
          this.performanceMetricsService.recordCacheHit();
        } else {
          this.performanceMetricsService.recordCacheMiss();
        }
      }

      // 느린 캐시 작업 로그
      if (responseTime > 100) {
        console.warn(
          `🐌 느린 캐시 작업: ${propertyName} - ${responseTime}ms (${cacheHit ? 'HIT' : 'MISS'})`,
        );
      }
    }
  };

  return descriptor;
}

/**
 * 데이터베이스 쿼리 성능 추적 데코레이터
 */
export function TrackQueryPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();

    try {
      const result = await method.apply(this, args);
      return result;
    } finally {
      const queryTime = Date.now() - startTime;
      const isSlow = queryTime > 1000; // 1초 이상은 느린 쿼리

      // 성능 메트릭 서비스가 있다면 기록
      if (this.performanceMetricsService) {
        this.performanceMetricsService.recordQuery(queryTime, isSlow);
      }

      // 느린 쿼리 로그
      if (isSlow) {
        console.warn(`🐌 느린 쿼리: ${propertyName} - ${queryTime}ms`);
      } else if (queryTime > 500) {
        console.debug(`⚠️ 지연 쿼리: ${propertyName} - ${queryTime}ms`);
      }
    }
  };

  return descriptor;
}
