import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Conversation } from '../../chat/entity/conversation.entity';
import { Organization } from './organization.entity';

export enum UserType {
  INDIVIDUAL = 'individual', // 개인 사용자
  BUSINESS = 'business', // 기업 사용자
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  ORG_ADMIN = 'org_admin', // 조직 관리자
  ORG_MEMBER = 'org_member', // 조직 구성원
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string | null;

  // 소셜 로그인 필드
  @Column({ nullable: true })
  provider?: string | null; // 'google', 'kakao', 'local'

  @Column({ nullable: true })
  providerId?: string | null; // 소셜 로그인 제공자의 사용자 ID

  @Column({ nullable: true })
  profileImage?: string | null; // 프로필 이미지 URL

  @Column({ nullable: true })
  name?: string | null;

  @Column({ nullable: false, default: 'male' })
  gender: string;

  @Column({ nullable: false, default: 2000 })
  birthYear: number;

  @Column({
    type: 'enum',
    enum: UserType,
    default: UserType.INDIVIDUAL,
  })
  userType: UserType;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    nullable: true,
  })
  organization?: Organization;

  @Column({ nullable: true })
  organizationId?: string | null;

  @Column({ type: 'json', default: '{}' })
  businessProfile: {
    department?: string;
    position?: string;
    permissions?: string[];
    businessModeApproved?: boolean; // 기업 모드 사용 승인 여부
    approvedBy?: string; // 승인한 관리자 ID
    approvedAt?: Date; // 승인 날짜
    approvalReason?: string; // 승인 사유
    revokedBy?: string; // 승인을 취소한 관리자 ID
    revokedAt?: Date; // 승인 취소 날짜
    revokeReason?: string; // 승인 취소 사유
    isActive?: boolean; // 사용자 활성화 상태
    statusChangedBy?: string; // 상태를 변경한 관리자 ID
    statusChangedAt?: Date; // 상태 변경 날짜
    statusChangeReason?: string; // 상태 변경 사유
  };

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
