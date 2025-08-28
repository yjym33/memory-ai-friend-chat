import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Goal } from './goal.entity';

export enum MilestoneStatus {
  PENDING = 'pending',
  ACHIEVED = 'achieved',
  OVERDUE = 'overdue',
}

@Entity('milestones')
export class Milestone {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'goal_id' })
  goalId: number;

  @ManyToOne(() => Goal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goal_id' })
  goal: Goal;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ type: 'int', default: 0 }) // 목표 대비 진행률 (0-100)
  targetProgress: number;

  @Column({ type: 'date', nullable: true })
  targetDate: Date;

  @Column({ type: 'date', nullable: true })
  achievedAt: Date;

  @Column({ type: 'int', default: 0 }) // 우선순위 (1-10)
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
