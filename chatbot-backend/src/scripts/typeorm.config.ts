import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../auth/entity/user.entity';
import { Conversation } from '../chat/entity/conversation.entity';
import { Goal } from '../agent/entities/goal.entity';
import { Emotion } from '../agent/entities/emotion.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';

// 환경변수 로드
config();

/**
 * TypeORM CLI를 위한 데이터 소스 설정
 * 마이그레이션 생성 및 실행에 사용됩니다.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'chatbot',
  entities: [User, Conversation, Goal, Emotion, AiSettings],
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false, // CLI에서는 항상 false
  logging: ['query', 'error'],
});
