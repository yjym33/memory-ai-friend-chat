import { Injectable, Logger } from '@nestjs/common';
import { safeParseInt } from '../../common/utils/env.util';

/**
 * Agent Cache Service
 * 대화 기억 및 에이전트 데이터를 위한 메모리 캐시 관리
 * LRU (Least Recently Used) 방식으로 캐시를 관리합니다.
 */
@Injectable()
export class AgentCacheService {
  private readonly logger = new Logger(AgentCacheService.name);

  // 메모리 캐시 (LRU 방식)
  private memoryCache = new Map<
    string,
    { data: string[]; timestamp: number }
  >();

  private readonly CACHE_TTL: number;
  private readonly MAX_CACHE_SIZE: number;

  constructor() {
    this.CACHE_TTL =
      safeParseInt(process.env.MEMORY_CACHE_TTL_MINUTES, 5) * 60 * 1000;
    this.MAX_CACHE_SIZE = safeParseInt(process.env.MEMORY_CACHE_MAX_SIZE, 100);

    // 캐시 정리 스케줄러 (10분마다 실행)
    setInterval(() => this.cleanup(), 10 * 60 * 1000);

    this.logger.log(
      `🚀 AgentCacheService 초기화 완료 (TTL: ${this.CACHE_TTL / 1000}s, MaxSize: ${this.MAX_CACHE_SIZE})`,
    );
  }

  /**
   * 캐시에서 데이터를 가져옵니다
   * @param key - 캐시 키
   * @returns 캐시된 데이터 또는 null
   */
  get(key: string): string[] | null {
    const cached = this.memoryCache.get(key);

    if (!cached) {
      return null;
    }

    // TTL 체크
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * 데이터를 캐시에 저장합니다
   * @param key - 캐시 키
   * @param data - 저장할 데이터
   */
  set(key: string, data: string[]): void {
    // 캐시 크기 제한
    if (this.memoryCache.size >= this.MAX_CACHE_SIZE) {
      // LRU 방식으로 가장 오래된 항목 제거
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) {
        this.memoryCache.delete(oldestKey);
      }
    }

    this.memoryCache.set(key, {
      data: [...data], // 깊은 복사로 메모리 격리
      timestamp: Date.now(),
    });
  }

  /**
   * 캐시에서 특정 키를 삭제합니다
   * @param key - 캐시 키
   * @returns 삭제 성공 여부
   */
  delete(key: string): boolean {
    return this.memoryCache.delete(key);
  }

  /**
   * 캐시에 키가 존재하는지 확인합니다
   * @param key - 캐시 키
   * @returns 존재 여부
   */
  has(key: string): boolean {
    const cached = this.memoryCache.get(key);
    if (!cached) return false;

    // TTL 체크
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 만료된 캐시 항목을 정리합니다
   */
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, cached] of this.memoryCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.memoryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.log(`🧹 메모리 캐시 정리 완료: ${cleanedCount}개 항목 제거`);
    }
  }

  /**
   * 캐시 상태를 반환합니다 (모니터링용)
   * @returns 캐시 통계
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    memoryUsage: number;
  } {
    // 캐시 메모리 사용량 추정
    let estimatedMemory = 0;
    for (const [key, cached] of this.memoryCache.entries()) {
      estimatedMemory += key.length * 2; // UTF-16
      estimatedMemory += cached.data.join('').length * 2;
      estimatedMemory += 64; // 객체 오버헤드 추정
    }

    return {
      size: this.memoryCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      ttl: this.CACHE_TTL,
      memoryUsage: estimatedMemory,
    };
  }

  /**
   * 특정 사용자의 캐시를 무효화합니다
   * @param userId - 사용자 ID
   */
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(`${userId}_`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.memoryCache.delete(key));

    if (keysToDelete.length > 0) {
      this.logger.log(
        `🔄 사용자 ${userId}의 캐시 ${keysToDelete.length}개 항목 무효화됨`,
      );
    }
  }

  /**
   * 모든 캐시를 초기화합니다
   */
  clear(): void {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    this.logger.log(`🗑️ 전체 캐시 초기화 완료: ${size}개 항목 삭제`);
  }

  /**
   * 캐시 TTL을 반환합니다
   */
  getCacheTTL(): number {
    return this.CACHE_TTL;
  }

  /**
   * 최대 캐시 크기를 반환합니다
   */
  getMaxCacheSize(): number {
    return this.MAX_CACHE_SIZE;
  }
}

