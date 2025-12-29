import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatbotLlmService } from './chatbot-llm.service';

/**
 * ChatbotLlmModule
 *
 * chatbot-llm 서비스와의 통신을 담당하는 모듈입니다.
 *
 * 이 모듈은 Python FastAPI로 구현된 chatbot-llm 서비스와 HTTP 통신하여
 * 프롬프트 생성 및 메모리 관리를 수행합니다.
 *
 * 제공하는 기능:
 * - 개인화된 프롬프트 생성 (AI 설정 + 메모리 통합)
 * - 사용자 메모리 저장
 * - 대화 컨텍스트 조회
 *
 * 다른 모듈에서 사용하려면:
 * - ChatModule 등에서 ChatbotLlmModule을 import
 * - ChatbotLlmService를 주입받아 사용
 */
@Module({
  imports: [
    // ConfigModule을 import하여 환경 변수 접근 가능
    ConfigModule,
  ],
  providers: [
    // ChatbotLlmService 제공
    ChatbotLlmService,
  ],
  exports: [
    // 다른 모듈에서 사용할 수 있도록 export
    ChatbotLlmService,
  ],
})
export class ChatbotLlmModule {
  private readonly logger = new Logger(ChatbotLlmModule.name);

  constructor() {
    this.logger.debug('[ChatbotLlmModule] Constructor 실행');
  }
}

