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
import { DocumentType } from '../../document/entity/document.entity';
import { LLMProvider } from '../../llm/types/llm.types';

export enum ChatMode {
  PERSONAL = 'personal', // 개인 AI 친구 모드
  BUSINESS = 'business', // 기업 쿼리 시스템 모드
}

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

  // 채팅 모드 설정
  @Column({
    type: 'enum',
    enum: ChatMode,
    default: ChatMode.PERSONAL,
  })
  chatMode: ChatMode;

  // 기업 모드 전용 설정
  @Column({ type: 'json', default: '{}' })
  businessSettings: {
    enabledDocumentTypes?: DocumentType[];
    searchScope?: 'organization' | 'department' | 'personal';
    responseStyle?: 'formal' | 'casual' | 'technical';
    includeSourceCitations?: boolean;
    maxSearchResults?: number;
    confidenceThreshold?: number;
  };

  // LLM 설정
  @Column({
    type: 'enum',
    enum: LLMProvider,
    default: LLMProvider.OPENAI,
  })
  llmProvider: LLMProvider;

  @Column({ type: 'varchar', default: 'gpt-5.1' })
  llmModel: string;

  @Column({ type: 'json', nullable: true })
  llmConfig: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    reasoningEffort?: 'none' | 'low' | 'medium' | 'high';
    [key: string]: any; // 모델별 추가 파라미터
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
