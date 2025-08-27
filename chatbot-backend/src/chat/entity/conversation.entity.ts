import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from '../../auth/entity/user.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: '새 대화' })
  title: string;

  @Column('jsonb')
  messages: {
    role: 'user' | 'assistant';
    content: string;
  }[];

  @ManyToOne(() => User, (user) => user.conversations)
  user: User;

  @Column()
  userId: string;

  @Column({ default: false })
  pinned: boolean;

  @Column({ type: 'jsonb', default: '{}' })
  theme: {
    // 기본 테마 설정
    primaryColor: string; // 메인 색상
    secondaryColor: string; // 보조 색상
    backgroundColor: string; // 배경 색상
    textColor: string; // 텍스트 색상
    accentColor: string; // 강조 색상

    // 채팅 버블 스타일
    userBubbleStyle: {
      backgroundColor: string;
      textColor: string;
      borderRadius: string;
    };

    aiBubbleStyle: {
      backgroundColor: string;
      textColor: string;
      borderRadius: string;
    };

    // 폰트 설정
    fontFamily: string;
    fontSize: string;

    // 배경 이미지/패턴
    backgroundImage?: string;
    backgroundPattern?: string;

    // 애니메이션 효과
    animations: {
      messageAppear: boolean;
      typingIndicator: boolean;
      bubbleHover: boolean;
    };
  };

  @Column({ default: 'default' })
  themeName: string; // 테마 이름 (사용자 정의 가능)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
