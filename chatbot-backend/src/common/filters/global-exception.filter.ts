import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

/**
 * 모든 예외를 처리하는 글로벌 예외 필터
 * - HTTP 예외, 데이터베이스 오류, 일반 예외를 구분하여 처리
 * - 적절한 로깅과 클라이언트 응답을 제공
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errorCode } = this.getErrorInfo(exception);

    // 요청 정보
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      timestamp: new Date().toISOString(),
    };

    // 에러 응답 객체
    const errorResponse = {
      success: false,
      statusCode: status,
      message,
      errorCode,
      timestamp: requestInfo.timestamp,
      path: request.url,
      method: request.method,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // 로깅
    this.logError(exception, requestInfo, status);

    // 클라이언트 응답
    response.status(status).json(errorResponse);
  }

  /**
   * 예외 유형에 따른 상태 코드, 메시지, 에러 코드 결정
   */
  private getErrorInfo(exception: unknown): {
    status: number;
    message: string;
    errorCode: string;
  } {
    // HTTP 예외 처리
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      return {
        status,
        message:
          typeof response === 'string'
            ? response
            : (response as any).message || exception.message,
        errorCode: `HTTP_${status}`,
      };
    }

    // TypeORM 데이터베이스 오류 처리
    if (exception instanceof QueryFailedError) {
      return this.handleDatabaseError(exception);
    }

    // 일반 Error 객체
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          process.env.NODE_ENV === 'development'
            ? exception.message
            : '서버 내부 오류가 발생했습니다.',
        errorCode: 'INTERNAL_SERVER_ERROR',
      };
    }

    // 알 수 없는 예외
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '알 수 없는 오류가 발생했습니다.',
      errorCode: 'UNKNOWN_ERROR',
    };
  }

  /**
   * 데이터베이스 오류 처리
   */
  private handleDatabaseError(error: QueryFailedError): {
    status: number;
    message: string;
    errorCode: string;
  } {
    const pgError = error.driverError as any;

    // PostgreSQL 에러 코드별 처리
    switch (pgError?.code) {
      case '23505': // unique_violation
        return {
          status: HttpStatus.CONFLICT,
          message: '이미 존재하는 데이터입니다.',
          errorCode: 'DUPLICATE_ENTRY',
        };

      case '23503': // foreign_key_violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '참조된 데이터가 존재하지 않습니다.',
          errorCode: 'FOREIGN_KEY_VIOLATION',
        };

      case '23502': // not_null_violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: '필수 필드가 누락되었습니다.',
          errorCode: 'REQUIRED_FIELD_MISSING',
        };

      case '42P01': // undefined_table
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: '데이터베이스 스키마 오류입니다.',
          errorCode: 'DATABASE_SCHEMA_ERROR',
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            process.env.NODE_ENV === 'development'
              ? `데이터베이스 오류: ${error.message}`
              : '데이터베이스 오류가 발생했습니다.',
          errorCode: 'DATABASE_ERROR',
        };
    }
  }

  /**
   * 에러 로깅
   */
  private logError(exception: unknown, requestInfo: any, status: number): void {
    const isClientError = status < 500;
    const logLevel = isClientError ? 'warn' : 'error';

    const logMessage = `${requestInfo.method} ${requestInfo.url} - ${status}`;

    const logMeta = {
      ...requestInfo,
      statusCode: status,
      error: {
        name:
          exception instanceof Error ? exception.constructor.name : 'Unknown',
        message:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      },
    };

    if (logLevel === 'error') {
      this.logger.error(
        logMessage,
        exception instanceof Error ? exception.stack : '',
        logMeta,
      );
    } else {
      this.logger.warn(logMessage, logMeta);
    }
  }
}
