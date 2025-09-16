import { plainToInstance, Transform } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  validateSync,
  IsNotEmpty,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * 환경변수 검증을 위한 클래스
 * 필수 환경변수들을 정의하고 유효성을 검사합니다.
 */
export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  PORT: number = 8080;

  // 데이터베이스 설정
  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  DB_PORT: number = 5432;

  @IsString()
  @IsOptional()
  DB_USERNAME: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_PASSWORD: string = 'postgres';

  @IsString()
  @IsOptional()
  DB_NAME: string = 'chatbot';

  // JWT 보안 설정 (개발환경에서는 기본값 제공)
  @IsString()
  @IsOptional()
  JWT_SECRET: string = 'dev-secret-key-change-in-production';

  // CORS 설정
  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';

  @IsString()
  @IsOptional()
  FRONTEND_URL: string = 'http://localhost:3000';

  // 데이터베이스 마이그레이션 설정
  @Transform(({ value }) => value === 'true')
  @IsOptional()
  DB_SYNCHRONIZE: boolean = true;

  @Transform(({ value }) => value === 'true')
  @IsOptional()
  DB_LOGGING: boolean = false;

  // 메모리 캐시 설정
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  MEMORY_CACHE_TTL_MINUTES: number = 5;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  MEMORY_CACHE_MAX_SIZE: number = 100;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  MAX_MEMORIES_PER_USER: number = 20;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  MAX_CONVERSATIONS_PER_QUERY: number = 10;
}

/**
 * 환경변수 검증 함수
 * 애플리케이션 시작 시 필수 환경변수들이 올바르게 설정되었는지 확인합니다.
 */
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`환경변수 검증 실패: ${errors.toString()}`);
  }

  return validatedConfig;
}
