import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../../chat/entity/conversation.entity';
import { AgentCacheService } from './agent-cache.service';
import { safeParseInt } from '../../common/utils/env.util';

/**
 * Memory Service
 * 대화 기억을 관리하고 최적화된 방식으로 기억을 로드합니다.
 */
@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  private readonly MAX_MEMORIES_PER_USER: number;
  private readonly MAX_CONVERSATIONS_PER_QUERY: number;

  // 민감한 정보 패턴
  private readonly sensitivePatterns: RegExp[] = [
    /password/i,
    /token/i,
    /secret/i,
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/, // 카드번호 패턴
    /\b\d{3}-\d{2}-\d{4}\b/, // 주민번호 패턴
  ];

  // 기억 우선순위 키워드
  private readonly priorityKeywords: Record<string, string[]> = {
    personal: ['이름', '나이', '직업', '가족', '개인', '취미', '좋아', '싫어'],
    emotion: ['기쁘', '슬프', '화', '불안', '걱정', '스트레스', '행복', '우울'],
    work: ['회사', '직장', '업무', '일', '프로젝트', '동료', '상사', '면접'],
    hobby: ['취미', '관심사', '좋아하는', '즐기는', '하고싶은'],
  };

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    private cacheService: AgentCacheService,
  ) {
    this.MAX_MEMORIES_PER_USER = safeParseInt(
      process.env.MAX_MEMORIES_PER_USER,
      20,
    );
    this.MAX_CONVERSATIONS_PER_QUERY = safeParseInt(
      process.env.MAX_CONVERSATIONS_PER_QUERY,
      10,
    );
  }

  /**
   * 최근 대화 기억을 가져옵니다 (캐싱 적용)
   * @param userId - 사용자 ID
   * @param retentionDays - 기억 보존 일수
   * @returns 최근 대화 내용
   */
  async getRecentMemories(userId: string, retentionDays: number): Promise<string[]> {
    const cacheKey = `${userId}_${retentionDays}`;

    // 캐시 확인
    const cachedData = this.cacheService.get(cacheKey);
    if (cachedData) {
      this.logger.debug(`🚀 사용자 ${userId}의 기억 정보 캐시에서 로드됨`);
      return cachedData;
    }

    try {
      const startTime = Date.now();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // 메모리 사용량 측정 시작
      const initialMemory = process.memoryUsage();

      // 메모리 효율적인 쿼리 빌더 사용 - 필요한 필드만 선택
      const conversations = await this.conversationRepository
        .createQueryBuilder('conversation')
        .select([
          'conversation.id',
          'conversation.createdAt',
          'conversation.messages',
        ])
        .where('conversation.userId = :userId', { userId })
        .andWhere('conversation.createdAt >= :cutoffDate', { cutoffDate })
        .orderBy('conversation.createdAt', 'DESC')
        .limit(this.MAX_CONVERSATIONS_PER_QUERY)
        .getMany();

      // 스트림 처리로 메모리 사용량 최적화
      const memories = await this.extractMemories(
        conversations,
        this.MAX_MEMORIES_PER_USER,
      );

      // 메모리 사용량 측정 종료
      const finalMemory = process.memoryUsage();
      const memoryDiff = {
        heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      };

      const processingTime = Date.now() - startTime;

      // 결과를 캐시에 저장
      this.cacheService.set(cacheKey, memories);

      this.logger.log(
        `🧠 사용자 ${userId}의 기억 정보 ${memories.length}개 로드됨 ` +
          `(처리시간: ${processingTime}ms, 메모리 사용: ${Math.round(memoryDiff.heapUsed / 1024)}KB)`,
      );

      return memories;
    } catch (error) {
      this.logger.error('대화 히스토리 로드 오류:', error);
      return [];
    }
  }

  /**
   * 대화에서 중요한 기억을 추출합니다 (스트림 처리)
   * @param conversations - 대화 목록
   * @param maxMemories - 최대 기억 개수
   * @returns 추출된 기억 목록
   */
  async extractMemories(
    conversations: any[],
    maxMemories: number,
  ): Promise<string[]> {
    const memories: string[] = [];

    // 각 대화를 순차적으로 처리하여 메모리 사용량 최소화
    for (const conversation of conversations) {
      if (memories.length >= maxMemories) {
        break; // 조기 종료로 불필요한 처리 방지
      }

      // null 체크 및 타입 안전성 확보
      if (!conversation.messages || !Array.isArray(conversation.messages)) {
        continue;
      }

      // 메시지를 청크 단위로 처리
      const messageChunks = this.chunkArray(conversation.messages, 5);

      for (const chunk of messageChunks) {
        const processedMemories = await this.processMessageChunk(
          chunk,
          maxMemories - memories.length,
        );

        memories.push(...processedMemories);

        if (memories.length >= maxMemories) {
          break;
        }
      }
    }

    return memories;
  }

  /**
   * 메시지 청크를 처리하여 중요한 정보를 추출합니다
   * @param messageChunk - 메시지 청크
   * @param remainingSlots - 남은 기억 슬롯 수
   * @returns 처리된 기억 목록
   */
  async processMessageChunk(
    messageChunk: any[],
    remainingSlots: number,
  ): Promise<string[]> {
    const chunkMemories: string[] = [];

    // 최근 메시지부터 처리 (역순)
    const recentMessages = messageChunk.slice(-5).reverse();

    for (const msg of recentMessages) {
      if (chunkMemories.length >= remainingSlots) {
        break;
      }

      // 메시지 유효성 검증
      if (!this.isValidMessage(msg)) {
        continue;
      }

      // 메시지 내용 정제 및 길이 제한
      const processedContent = this.sanitizeContent(msg.content);

      if (processedContent) {
        const rolePrefix = msg.role === 'user' ? '사용자' : 'AI';
        chunkMemories.push(`${rolePrefix}: ${processedContent}`);
      }
    }

    return chunkMemories;
  }

  /**
   * 기억 우선순위를 적용합니다
   * @param memories - 원본 기억들
   * @param priorities - 기억 우선순위 설정
   * @returns 우선순위가 적용된 기억들
   */
  prioritizeMemories(memories: string[], priorities: any): string[] {
    return memories.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      for (const [category, keywords] of Object.entries(this.priorityKeywords)) {
        const priority = priorities?.[category] || 3;
        const keywordList = keywords as string[];

        const matchesA = keywordList.filter((keyword) =>
          a.includes(keyword),
        ).length;
        const matchesB = keywordList.filter((keyword) =>
          b.includes(keyword),
        ).length;

        scoreA += matchesA * priority;
        scoreB += matchesB * priority;
      }

      return scoreB - scoreA;
    });
  }

  /**
   * 메시지가 유효한지 검증합니다
   * @param msg - 메시지 객체
   * @returns 유효성 여부
   */
  isValidMessage(msg: any): boolean {
    return (
      msg &&
      typeof msg === 'object' &&
      typeof msg.content === 'string' &&
      msg.content.trim().length > 10 &&
      msg.content.length < 1000 && // 너무 긴 메시지는 제외
      ['user', 'assistant'].includes(msg.role)
    );
  }

  /**
   * 메시지 내용을 정제합니다
   * @param content - 원본 메시지 내용
   * @returns 정제된 메시지 내용
   */
  sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // 불필요한 공백 제거 및 길이 제한
    let sanitized = content.trim().replace(/\s+/g, ' ');

    // 최대 200자로 제한 (메모리 절약)
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 197) + '...';
    }

    // 민감한 정보가 포함된 패턴 필터링
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(sanitized)) {
        return ''; // 민감한 정보가 포함된 메시지는 제외
      }
    }

    return sanitized;
  }

  /**
   * 배열을 지정된 크기의 청크로 분할합니다
   * @param array - 분할할 배열
   * @param chunkSize - 청크 크기
   * @returns 분할된 청크 배열
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
  }

  /**
   * 특정 사용자의 캐시를 무효화합니다
   * @param userId - 사용자 ID
   */
  invalidateUserCache(userId: string): void {
    this.cacheService.invalidateUser(userId);
  }

  /**
   * 캐시 상태를 반환합니다 (모니터링용)
   * @returns 캐시 통계
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    memoryUsage: number;
  } {
    return this.cacheService.getStats();
  }
}

