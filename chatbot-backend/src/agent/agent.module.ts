import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AgentController } from './agent.controller';

// Main Service (Orchestrator)
import { AgentService } from './agent.service';

// Sub Services
import {
  AgentCacheService,
  EmotionAnalyzerService,
  GoalManagerService,
  MemoryService,
  MilestoneService,
  PromptGeneratorService,
  SuggestionService,
} from './services';

// Entities
import { Emotion } from './entities/emotion.entity';
import { Goal } from './entities/goal.entity';
import { Milestone } from './entities/milestone.entity';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';
import { Conversation } from '../chat/entity/conversation.entity';
import { Logger } from '@nestjs/common';

/**
 * Agent Module
 *
 * AI 에이전트 관련 기능을 제공하는 모듈입니다.
 *
 * 구조:
 * - AgentService: 오케스트레이터 (각 서비스를 조율)
 * - AgentCacheService: 캐시 관리
 * - EmotionAnalyzerService: 감정 분석
 * - GoalManagerService: 목표 관리
 * - MemoryService: 대화 기억 관리
 * - MilestoneService: 마일스톤 관리
 * - PromptGeneratorService: 프롬프트 생성
 * - SuggestionService: 추천 질문 생성
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Emotion,
      Goal,
      Milestone,
      AiSettings,
      Conversation,
    ]),
  ],
  controllers: [AgentController],
  providers: [
    // 캐시 서비스 (의존성 없음 - 가장 먼저 로드)
    AgentCacheService,

    // 마일스톤 서비스
    MilestoneService,

    // 감정 분석 서비스
    EmotionAnalyzerService,

    // 목표 관리 서비스 (MilestoneService 의존)
    GoalManagerService,

    // 메모리 서비스 (AgentCacheService 의존)
    MemoryService,

    // 프롬프트 생성 서비스
    PromptGeneratorService,

    // 추천 질문 생성 서비스
    SuggestionService,

    // 메인 오케스트레이터 서비스 (모든 서비스 의존)
    AgentService,
  ],
  exports: [
    AgentService,
    // 필요한 경우 다른 모듈에서 개별 서비스 사용 가능
    EmotionAnalyzerService,
    GoalManagerService,
    MemoryService,
    AgentCacheService,
  ],
})
export class AgentModule {
  private readonly logger = new Logger(AgentModule.name);

  constructor() {
    this.logger.debug('[AgentModule] Constructor 실행 - 모듈 인스턴스 생성');
  }
}
