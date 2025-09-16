import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Conversation } from '../chat/entity/conversation.entity';
import { User } from '../auth/entity/user.entity';
import { Goal } from '../agent/entities/goal.entity';
import { Emotion } from '../agent/entities/emotion.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';
import { safeParseInt } from '../common/utils/env.util';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: safeParseInt(process.env.DB_PORT, 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'chatbot',
    entities: [User, Conversation, Goal, Emotion, AiSettings],

    // 환경별 설정
    synchronize: getSynchronizeConfig(nodeEnv),
    logging: getLoggingConfig(nodeEnv),

    // 마이그레이션 설정
    migrations: ['dist/migrations/*{.ts,.js}'],
    migrationsTableName: 'typeorm_migrations',
    migrationsRun: nodeEnv === 'production', // 운영환경에서만 자동 실행

    autoLoadEntities: true,
  };
});

/**
 * 환경별 synchronize 설정
 */
function getSynchronizeConfig(nodeEnv: string): boolean {
  // 환경변수가 있으면 우선 사용
  if (process.env.DB_SYNCHRONIZE !== undefined) {
    return process.env.DB_SYNCHRONIZE === 'true';
  }

  // 환경별 기본값
  switch (nodeEnv) {
    case 'production':
      return false; // 운영환경에서는 절대 true로 하면 안됨
    case 'test':
      return true; // 테스트 환경에서는 매번 새로 생성
    case 'development':
    default:
      return true; // 개발환경에서만 true
  }
}

/**
 * 환경별 로깅 설정
 */
function getLoggingConfig(
  nodeEnv: string,
):
  | boolean
  | 'all'
  | ('query' | 'error' | 'schema' | 'warn' | 'info' | 'log' | 'migration')[] {
  // 환경변수가 있으면 우선 사용
  if (process.env.DB_LOGGING !== undefined) {
    return process.env.DB_LOGGING === 'true';
  }

  // 환경별 기본값
  switch (nodeEnv) {
    case 'production':
      return ['error']; // 운영환경에서는 에러만
    case 'test':
      return false; // 테스트 환경에서는 로깅 끄기
    case 'development':
    default:
      return ['query', 'error', 'warn']; // 개발환경에서는 자세히
  }
}
