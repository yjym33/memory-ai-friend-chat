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

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

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
  organizationId?: string;

  @Column({ type: 'json', default: '{}' })
  businessProfile: {
    department?: string;
    position?: string;
    permissions?: string[];
  };

  @OneToMany(() => Conversation, (conversation) => conversation.user)
  conversations: Conversation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
