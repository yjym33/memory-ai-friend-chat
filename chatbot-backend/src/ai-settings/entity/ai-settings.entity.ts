import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entity/user.entity';

@Entity()
export class AiSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  // AI 성격 설정
  @Column({ default: '친근함' })
  personalityType: string; // 친근함, 차분함, 활발함, 따뜻함

  @Column({ default: '반말' })
  speechStyle: string; // 격식체, 반말

  @Column({ type: 'int', default: 3 })
  emojiUsage: number; // 1-5 (적게~많이)

  @Column({ nullable: true })
  nickname: string; // AI가 사용자를 부르는 이름

  @Column({ type: 'int', default: 3 })
  empathyLevel: number; // 1-5 (차분함~적극적)

  // 기억 관리 설정
  @Column({ type: 'int', default: 90 })
  memoryRetentionDays: number; // 기억 보존 기간

  @Column({ type: 'json', default: '{}' })
  memoryPriorities: {
    personal: number; // 1-5
    hobby: number;
    work: number;
    emotion: number;
  };

  @Column({ type: 'json', default: '{}' })
  userProfile: {
    interests: string[];
    currentGoals: string[];
    importantDates: { name: string; date: string }[];
  };

  @Column({ type: 'json', default: '[]' })
  avoidTopics: string[]; // 피해야 할 주제들

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
