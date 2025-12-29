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
import { LLMModule } from '../llm/llm.module';
import { ChatbotLlmModule } from '../chatbot-llm/chatbot-llm.module';
import { ImageGenerationModule } from '../image-generation/image-generation.module';
import { LlmService } from '../common/services/llm.service';
import { FileExtractionService } from '../common/services/file-extraction.service';
import { Logger } from '@nestjs/common';

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
    LLMModule, // LLM 통합 모듈
    ChatbotLlmModule, // chatbot-llm 서비스 모듈 (프롬프트 생성 + 메모리 관리)
    ImageGenerationModule, // 이미지 생성 모듈
  ],
  controllers: [ChatController],
  providers: [ChatService, LlmService, FileExtractionService],
  exports: [ChatService], // 다른 모듈에서 ChatService 사용 가능
})
export class ChatModule {
  private readonly logger = new Logger(ChatModule.name);

  constructor() {
    this.logger.debug('[ChatModule] Constructor 실행');
  }
}
