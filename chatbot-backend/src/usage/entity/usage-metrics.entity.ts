import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../auth/entity/user.entity';
import { Organization } from '../../auth/entity/organization.entity';

export enum UsageType {
  DOCUMENT_UPLOAD = 'document_upload',
  DOCUMENT_SEARCH = 'document_search',
  CHAT_MESSAGE = 'chat_message',
  AI_RESPONSE = 'ai_response',
  EMBEDDING_GENERATION = 'embedding_generation',
}

@Entity()
@Index(['organizationId', 'date'])
@Index(['userId', 'date'])
@Index(['usageType', 'date'])
export class UsageMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column({ nullable: true })
  userId?: string;

  @ManyToOne(() => Organization, { nullable: true })
  organization?: Organization;

  @Column({ nullable: true })
  organizationId?: string;

  @Column({
    type: 'enum',
    enum: UsageType,
  })
  usageType: UsageType;

  @Column({ type: 'date' })
  date: Date; // 날짜별 집계를 위한 필드

  @Column({ type: 'int', default: 1 })
  count: number; // 사용 횟수

  @Column({ type: 'bigint', default: 0 })
  tokenUsage: number; // 토큰 사용량

  @Column({ type: 'bigint', default: 0 })
  dataSize: number; // 데이터 크기 (bytes)

  @Column({ type: 'float', default: 0 })
  cost: number; // 비용 (USD)

  @Column({ type: 'json', default: '{}' })
  metadata: {
    model?: string;
    documentType?: string;
    searchQuery?: string;
    responseTime?: number; // ms
    success?: boolean;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
