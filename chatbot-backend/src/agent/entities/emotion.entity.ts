import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entity/user.entity';

export enum EmotionType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  ANXIOUS = 'anxious',
  EXCITED = 'excited',
  FRUSTRATED = 'frustrated',
  CALM = 'calm',
  STRESSED = 'stressed',
  CONFUSED = 'confused',
  PROUD = 'proud',
}

@Entity('emotions')
export class Emotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: EmotionType,
  })
  type: EmotionType;

  @Column({ type: 'int', default: 5 }) // 1-10 점수
  intensity: number;

  @Column({ type: 'text', nullable: true })
  context: string; // 감정이 발생한 상황/맥락

  @Column({ type: 'text', nullable: true })
  trigger: string; // 감정 유발 요인

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
