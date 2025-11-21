import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { AiSettings } from '../ai-settings/entity/ai-settings.entity';

/**
 * 프롬프트 생성 응답 인터페이스
 * chatbot-llm 서비스에서 반환하는 프롬프트 생성 결과
 */
export interface PromptResponse {
  /** 생성된 개인화된 시스템 프롬프트 */
  systemPrompt: string;
  /** 완전한 메시지 배열 (system + context + user) */
  messages: Array<{ role: string; content: string }>;
  /** 포함된 컨텍스트 메시지 수 */
  contextLength: number;
  /** 메모리가 포함되었는지 여부 */
  memoryIncluded: boolean;
  /** 현재 메시지와 관련된 중요 메모리 목록 (선택사항) */
  relevantMemories?: string[];
}

/**
 * 메모리 저장 요청 인터페이스
 */
export interface MemoryRequest {
  userId: string;
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  importance?: number;
  memoryType?: string;
}

/**
 * 메모리 저장 응답 인터페이스
 */
export interface MemoryResponse {
  /** 저장된 메모리의 고유 ID (장기 메모리인 경우) */
  memoryId: string;
  /** 저장 성공 여부 */
  stored: boolean;
  /** 메모리 타입 */
  memoryType: string;
  /** 메모리 중요도 */
  importance: number;
}

/**
 * 컨텍스트 조회 응답 인터페이스
 */
export interface ContextResponse {
  /** 대화 메시지 배열 */
  context: Array<{ role: string; content: string; timestamp?: string }>;
  /** 메모리 요약 */
  memorySummary: string;
  /** 관련 메모리 목록 */
  relevantMemories: string[];
  /** 전체 컨텍스트 길이 */
  contextLength: number;
}

/**
 * chatbot-llm 서비스 통신 클래스
 *
 * 이 서비스는 Python FastAPI로 구현된 chatbot-llm 서비스와 통신하여
 * 프롬프트 생성 및 메모리 관리를 담당합니다.
 *
 * 주요 기능:
 * - 개인화된 프롬프트 생성 (AI 설정 + 메모리 통합)
 * - 사용자 메모리 저장 (대화 내용 보관)
 * - 대화 컨텍스트 조회
 *
 * 에러 처리:
 * - chatbot-llm 서비스 장애 시 폴백 로직 제공
 * - 타임아웃 처리 (기본 5초)
 * - 메모리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
 */
@Injectable()
export class ChatbotLlmService {
  private readonly logger = new Logger(ChatbotLlmService.name);

  /** chatbot-llm 서비스 URL (환경 변수에서 가져옴) */
  private readonly chatbotLlmUrl: string;

  /** HTTP 요청 타임아웃 (밀리초) */
  private readonly timeout: number = 5000; // 5초

  /**
   * 생성자
   * ConfigService를 주입받아 chatbot-llm 서비스 URL을 설정합니다.
   *
   * @param configService - NestJS ConfigService 인스턴스
   */
  constructor(private configService: ConfigService) {
    // 환경 변수에서 chatbot-llm 서비스 URL 가져오기
    // 없으면 기본값(http://localhost:3002) 사용
    this.chatbotLlmUrl =
      this.configService.get<string>('CHATBOT_LLM_URL') ||
      'http://localhost:3002';

    this.logger.log(`chatbot-llm 서비스 URL: ${this.chatbotLlmUrl}`);
  }

  /**
   * 개인화된 프롬프트 생성
   *
   * chatbot-llm 서비스에 요청하여 AI 설정과 메모리를 통합한
   * 개인화된 시스템 프롬프트를 생성합니다.
   *
   * 프로세스:
   * 1. chatbot-llm 서비스에 프롬프트 생성 요청
   * 2. AI 설정과 메모리, 대화 컨텍스트를 통합하여 프롬프트 생성
   * 3. 완전한 메시지 배열 반환 (system + context + user)
   *
   * 폴백:
   * - chatbot-llm 서비스 장애 시 기본 프롬프트 생성
   * - 메모리 없이 간단한 프롬프트만 반환
   *
   * @param userId - 사용자 고유 ID
   * @param conversationId - 대화 고유 ID (선택사항, 특정 대화의 컨텍스트를 가져올 때 사용)
   * @param message - 사용자가 입력한 현재 메시지
   * @param aiSettings - AI 설정 (성격, 말투, 이모지 사용 등)
   * @param maxContextMessages - 포함할 최대 컨텍스트 메시지 수 (기본값: 6)
   * @returns 프롬프트 생성 응답 (PromptResponse)
   */
  async generatePrompt(
    userId: string,
    conversationId: string | null,
    message: string,
    aiSettings: AiSettings,
    maxContextMessages: number = 6,
  ): Promise<PromptResponse> {
    try {
      this.logger.debug(
        `프롬프트 생성 요청 - ` +
          `사용자: ${userId}, ` +
          `대화: ${conversationId || '없음'}, ` +
          `메시지 길이: ${message.length}`,
      );

      // chatbot-llm 서비스에 프롬프트 생성 요청
      const response = await axios.post<PromptResponse>(
        `${this.chatbotLlmUrl}/api/v1/prompt`,
        {
          userId,
          conversationId,
          message,
          // AiSettings 엔티티를 DTO 형태로 변환
          aiSettings: this.convertAiSettingsToDto(aiSettings),
          maxContextMessages,
        },
        {
          timeout: this.timeout, // 5초 타임아웃
        },
      );

      this.logger.log(
        `프롬프트 생성 완료 - ` +
          `메시지 수: ${response.data.messages.length}, ` +
          `컨텍스트 길이: ${response.data.contextLength}, ` +
          `메모리 포함: ${response.data.memoryIncluded}`,
      );

      return response.data;
    } catch (error) {
      // 에러 발생 시 로깅
      this.handleError(error, '프롬프트 생성');

      // 폴백: 기본 프롬프트 생성 (chatbot-llm 서비스 없이도 동작)
      this.logger.warn('chatbot-llm 서비스 사용 불가 - 폴백 프롬프트 생성');
      return this.generateFallbackPrompt(aiSettings, message);
    }
  }

  /**
   * 메모리 저장
   *
   * 사용자 메시지와 AI 응답을 chatbot-llm 서비스의 메모리 시스템에 저장합니다.
   * 중요도에 따라 단기 또는 장기 메모리에 저장됩니다.
   *
   * 중요도 기준:
   * - 1-3: 일반 대화 (단기 메모리만)
   * - 4-6: 중요 정보 (단기 + 선택적 장기)
   * - 7-10: 매우 중요 (단기 + 장기 메모리)
   *
   * 에러 처리:
   * - 메모리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
   * - 대화는 정상적으로 진행되며, 메모리만 저장되지 않음
   *
   * @param userId - 사용자 고유 ID
   * @param conversationId - 대화 고유 ID (선택사항, 대화별 컨텍스트 관리에 사용)
   * @param userMessage - 사용자가 입력한 메시지
   * @param assistantMessage - AI가 생성한 응답
   * @param importance - 메모리 중요도 (1-10, 기본값: 3)
   * @param memoryType - 메모리 타입 (기본값: "conversation")
   * @returns 메모리 저장 응답 (MemoryResponse)
   */
  async saveMemory(
    userId: string,
    conversationId: string | null,
    userMessage: string,
    assistantMessage: string,
    importance: number = 3,
    memoryType: string = 'conversation',
  ): Promise<MemoryResponse> {
    try {
      this.logger.debug(
        `메모리 저장 요청 - ` +
          `사용자: ${userId}, ` +
          `대화: ${conversationId || '없음'}, ` +
          `중요도: ${importance}`,
      );

      // chatbot-llm 서비스에 메모리 저장 요청
      const response = await axios.post<MemoryResponse>(
        `${this.chatbotLlmUrl}/api/v1/memory`,
        {
          userId,
          conversationId,
          userMessage,
          assistantMessage,
          importance,
          memoryType,
        },
        {
          timeout: this.timeout, // 5초 타임아웃
        },
      );

      this.logger.log(
        `메모리 저장 완료 - ` +
          `메모리 ID: ${response.data.memoryId}, ` +
          `저장됨: ${response.data.stored}, ` +
          `중요도: ${response.data.importance}`,
      );

      return response.data;
    } catch (error) {
      // 에러 로깅
      this.handleError(error, '메모리 저장');

      // 메모리 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
      // 대화는 정상적으로 진행되며, 메모리만 저장되지 않음
      this.logger.warn('메모리 저장 실패했지만 계속 진행합니다.');

      return {
        memoryId: 'failed',
        stored: false,
        memoryType,
        importance,
      };
    }
  }

  /**
   * 컨텍스트 조회
   *
   * 사용자의 대화 컨텍스트를 chatbot-llm 서비스에서 조회합니다.
   *
   * @param userId - 사용자 고유 ID
   * @param conversationId - 대화 고유 ID (선택사항, 특정 대화의 컨텍스트를 가져올 때 사용)
   * @param limit - 반환할 최대 메시지 수 (기본값: 6)
   * @returns 컨텍스트 조회 응답 (ContextResponse)
   */
  async getContext(
    userId: string,
    conversationId: string | null,
    limit: number = 6,
  ): Promise<ContextResponse> {
    try {
      this.logger.debug(
        `컨텍스트 조회 요청 - ` +
          `사용자: ${userId}, ` +
          `대화: ${conversationId || '없음'}, ` +
          `제한: ${limit}`,
      );

      // 쿼리 파라미터 구성
      const params: Record<string, any> = {
        userId,
        limit,
      };

      // conversationId가 있으면 쿼리 파라미터에 추가
      if (conversationId) {
        params.conversationId = conversationId;
      }

      // chatbot-llm 서비스에 컨텍스트 조회 요청
      const response = await axios.get<ContextResponse>(
        `${this.chatbotLlmUrl}/api/v1/context`,
        {
          params,
          timeout: this.timeout, // 5초 타임아웃
        },
      );

      this.logger.log(
        `컨텍스트 조회 완료 - ` +
          `컨텍스트 길이: ${response.data.contextLength}, ` +
          `반환 메시지 수: ${response.data.context.length}`,
      );

      return response.data;
    } catch (error) {
      // 에러 로깅
      this.handleError(error, '컨텍스트 조회');

      // 폴백: 빈 컨텍스트 반환
      this.logger.warn('컨텍스트 조회 실패 - 빈 컨텍스트 반환');

      return {
        context: [],
        memorySummary: '',
        relevantMemories: [],
        contextLength: 0,
      };
    }
  }

  /**
   * AiSettings 엔티티를 DTO 형태로 변환
   *
   * TypeORM 엔티티를 JSON 직렬화 가능한 형태로 변환합니다.
   *
   * @param aiSettings - AiSettings 엔티티
   * @returns JSON 직렬화 가능한 DTO 객체
   */
  private convertAiSettingsToDto(aiSettings: AiSettings): any {
    return {
      personalityType: aiSettings.personalityType,
      speechStyle: aiSettings.speechStyle,
      emojiUsage: aiSettings.emojiUsage,
      empathyLevel: aiSettings.empathyLevel,
      nickname: aiSettings.nickname,
      memoryRetentionDays: aiSettings.memoryRetentionDays,
      memoryPriorities: aiSettings.memoryPriorities,
      userProfile: aiSettings.userProfile,
      avoidTopics: aiSettings.avoidTopics,
    };
  }

  /**
   * 에러 처리 헬퍼 메서드
   *
   * axios 에러와 일반 에러를 구분하여 적절히 로깅합니다.
   *
   * @param error - 발생한 에러
   * @param operation - 수행 중이던 작업 이름 (로깅용)
   */
  private handleError(error: any, operation: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // 네트워크 에러 유형별 처리
      if (axiosError.code === 'ECONNREFUSED') {
        this.logger.error(
          `chatbot-llm 서비스에 연결할 수 없습니다: ${this.chatbotLlmUrl}. ` +
            `서비스가 실행 중인지 확인하세요.`,
        );
      } else if (
        axiosError.code === 'ETIMEDOUT' ||
        axiosError.code === 'ECONNABORTED'
      ) {
        this.logger.error(
          `${operation} 타임아웃 (${this.timeout}ms). ` +
            `chatbot-llm 서비스가 응답하지 않습니다.`,
        );
      } else if (axiosError.response) {
        // HTTP 에러 응답
        this.logger.error(
          `${operation} 실패 - HTTP ${axiosError.response.status}: ` +
            `${axiosError.response.statusText}`,
        );
      } else {
        // 기타 axios 에러
        this.logger.error(
          `${operation} 실패: ${axiosError.message}`,
          axiosError.stack,
        );
      }
    } else {
      // 일반 에러
      this.logger.error(`${operation} 실패: ${error.message}`, error.stack);
    }
  }

  /**
   * 폴백 프롬프트 생성 (chatbot-llm 서비스 장애 시)
   *
   * chatbot-llm 서비스에 연결할 수 없을 때 사용하는 기본 프롬프트를 생성합니다.
   * 메모리 없이 AI 설정만 사용하여 간단한 프롬프트를 생성합니다.
   *
   * @param aiSettings - AI 설정 (성격, 말투 등)
   * @param message - 사용자 메시지
   * @returns 기본 프롬프트 생성 응답 (PromptResponse)
   */
  private generateFallbackPrompt(
    aiSettings: AiSettings,
    message: string,
  ): PromptResponse {
    this.logger.warn('chatbot-llm 서비스 사용 불가 - 폴백 프롬프트 생성');

    // AI 설정에서 기본 정보 추출
    const personality = aiSettings.personalityType || '친근함';
    const speechStyle = aiSettings.speechStyle || '반말';
    const nickname = aiSettings.nickname || '친구';
    const emojiUsage = aiSettings.emojiUsage || 3;

    // 간단한 시스템 프롬프트 생성 (메모리 없이)
    let systemPrompt = `당신은 '${nickname}'의 AI 친구 '루나'입니다.\n\n`;

    // 말투 지시
    if (speechStyle === '반말') {
      systemPrompt += '⚠️ 중요: 반드시 반말로만 대화하세요!\n';
    } else {
      systemPrompt += '⚠️ 중요: 반드시 존댓말로만 대화하세요!\n';
    }

    // 성격 지시
    const personalityMap: Record<string, string> = {
      친근함: '매우 친근하고 편안한 톤으로',
      차분함: '차분하고 안정적인 톤으로',
      활발함: '밝고 에너지 넘치는 톤으로',
      따뜻함: '따뜻하고 포근한 톤으로',
    };
    systemPrompt += `\n🎭 성격: ${personalityMap[personality] || '친근하게'} 대화하세요.\n`;

    // 이모지 지시
    if (emojiUsage >= 4) {
      systemPrompt +=
        '\n😊 이모지: 이모티콘을 자주 사용해서 감정을 풍부하게 표현하세요.\n';
    } else if (emojiUsage >= 2) {
      systemPrompt += '\n😊 이모지: 이모티콘을 적당히 사용하세요.\n';
    } else {
      systemPrompt += '\n😊 이모지: 이모티콘 사용을 최소화하세요.\n';
    }

    systemPrompt += '\n지금부터 대화를 시작합니다!';

    // 기본 메시지 배열 반환
    return {
      systemPrompt,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      contextLength: 0, // 폴백에서는 컨텍스트 없음
      memoryIncluded: false, // 폴백에서는 메모리 없음
    };
  }
}
