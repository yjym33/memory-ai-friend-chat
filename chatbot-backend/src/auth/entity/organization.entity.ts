import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';

export enum OrganizationType {
  STARTUP = 'startup',
  SME = 'sme', // 중소기업
  ENTERPRISE = 'enterprise', // 대기업
  NON_PROFIT = 'non_profit', // 비영리
  GOVERNMENT = 'government', // 공공기관
  EDUCATION = 'education', // 교육기관
}

export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

@Entity()
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    default: OrganizationType.STARTUP,
  })
  type: OrganizationType;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscriptionTier: SubscriptionTier;

  @Column({ nullable: true })
  domain: string; // 회사 도메인 (예: @company.com)

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'json', default: '{}' })
  settings: {
    maxUsers?: number;
    maxDocuments?: number;
    maxQueriesPerMonth?: number;
    enabledFeatures?: string[];
    customBranding?: boolean;
  };

  @Column({ type: 'json', default: '{}' })
  billingInfo: {
    contactEmail?: string;
    address?: string;
    taxId?: string;
  };

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
