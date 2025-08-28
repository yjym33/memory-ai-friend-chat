import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entity/user.entity';
import { Milestone } from './milestone.entity';

export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

export enum GoalCategory {
  HEALTH = 'health',
  CAREER = 'career',
  EDUCATION = 'education',
  RELATIONSHIP = 'relationship',
  FINANCE = 'finance',
  PERSONAL = 'personal',
  HOBBY = 'hobby',
  TRAVEL = 'travel',
  OTHER = 'other',
}

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: GoalCategory,
    default: GoalCategory.PERSONAL,
  })
  category: GoalCategory;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ type: 'int', default: 0 }) // 0-100 백분율
  progress: number;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'int', default: 5 }) // 1-10 중요도
  priority: number;

  @Column({ type: 'json', nullable: true })
  milestoneData: string[]; // 중간 목표들 (레거시 데이터)

  @Column({ type: 'date', nullable: true })
  lastCheckedAt: Date; // 마지막 점검 날짜

  @Column({ type: 'date', nullable: true })
  completedAt: Date; // 목표 완료 날짜

  @OneToMany(() => Milestone, (milestone) => milestone.goal, { cascade: true })
  milestones: Milestone[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
