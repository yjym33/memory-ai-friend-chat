import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

/**
 * Winston 로거 설정
 * 환경별로 다른 로깅 레벨과 형식을 적용합니다.
 */
export const createLoggerConfig = (): WinstonModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`[LoggerConfig] Winston 로거 설정 생성 시작 - 환경: ${nodeEnv}`);

  // 로그 파일 저장 경로
  const logDir = 'logs';

  // 기본 포맷 설정
  const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
      ({ timestamp, level, message, stack, context, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]`;

        if (context) {
          log += ` [${context}]`;
        }

        log += ` ${message}`;

        if (stack) {
          log += `\n${stack}`;
        }

        // 추가 메타 데이터가 있으면 포함
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return log;
      },
    ),
  );

  // 콘솔 포맷 (개발환경용)
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    nestWinstonModuleUtilities.format.nestLike('ChatBot', {
      colors: true,
      prettyPrint: true,
    }),
  );

  // 환경별 Transports 설정
  const transports: winston.transport[] = [];

  // 모든 환경에서 에러 로그는 파일로 저장
  transports.push(
    new winston.transports.File({
      filename: `${logDir}/error.log`,
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );

  if (nodeEnv === 'production') {
    // 운영환경: 파일 로깅 위주
    transports.push(
      new winston.transports.File({
        filename: `${logDir}/combined.log`,
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
      }),
    );

    // 운영환경에서도 중요한 로그는 콘솔에 출력
    transports.push(
      new winston.transports.Console({
        level: 'warn',
        format: consoleFormat,
      }),
    );
  } else if (nodeEnv === 'test') {
    // 테스트 환경: 최소한의 로깅
    transports.push(
      new winston.transports.Console({
        level: 'error',
        format: winston.format.simple(),
        silent: process.env.TEST_SILENT === 'true',
      }),
    );
  } else {
    // 개발환경: 콘솔 위주 + 파일
    transports.push(
      new winston.transports.Console({
        level: 'debug',
        format: consoleFormat,
      }),
    );

    transports.push(
      new winston.transports.File({
        filename: `${logDir}/debug.log`,
        level: 'debug',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      }),
    );
  }

  const logLevel = getLogLevel(nodeEnv);
  console.log(`[LoggerConfig] Winston 로거 설정 완료 - 레벨: ${logLevel}, 환경: ${nodeEnv}`);
  
  return {
    level: logLevel,
    format: logFormat,
    transports,
    // 처리되지 않은 예외 로깅
    exceptionHandlers: [
      new winston.transports.File({
        filename: `${logDir}/exceptions.log`,
        format: logFormat,
      }),
    ],
    // 처리되지 않은 Promise rejection 로깅
    rejectionHandlers: [
      new winston.transports.File({
        filename: `${logDir}/rejections.log`,
        format: logFormat,
      }),
    ],
  };
};

/**
 * 환경별 로그 레벨 설정
 */
function getLogLevel(nodeEnv: string): string {
  switch (nodeEnv) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
}

/**
 * 로그 디렉토리 생성을 위한 설정
 */
export const logDirectory = 'logs';
