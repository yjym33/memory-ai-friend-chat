import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Conversation } from './entity/conversation.entity';
import { User } from '../auth/entity/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AiSettingsModule } from '../ai-settings/ai-settings.module';
import { AgentModule } from '../agent/agent.module';
import { DocumentModule } from '../document/document.module';

/**
 * 채팅 기능을 위한 모듈
 * 대화 관리와 AI 응답 생성을 위한 컴포넌트들을 통합합니다.
 */
@Module({
  imports: [
    // 데이터베이스 엔티티 등록
    TypeOrmModule.forFeature([Conversation, User]),

    // 의존성 모듈
    AuthModule,
    AiSettingsModule, // AI 설정 관리
    AgentModule, // AI 에이전트 처리
    DocumentModule, // 문서 관리
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService], // 다른 모듈에서 ChatService 사용 가능
})
export class ChatModule {}
