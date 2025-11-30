import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageMetrics, UsageType } from './entity/usage-metrics.entity';
import {
  Organization,
  SubscriptionTier,
} from '../auth/entity/organization.entity';

interface UsageLimits {
  maxDocuments: number;
  maxQueriesPerMonth: number;
  maxStorageGB: number;
  maxUsersPerOrg: number;
}

/**
 * 사용량 기록 메타데이터
 */
interface UsageMetadata {
  documentId?: string;
  queryText?: string;
  model?: string;
  provider?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * 사용량 확인 결과
 */
interface UsageLimitCheckResult {
  allowed: boolean;
  reason?: string;
  usage?: UsageStats;
  limits?: UsageLimits;
}

/**
 * 사용량 통계
 */
interface UsageStats {
  documents: number;
  queries: number;
  storage: number;
}

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageMetrics)
    private usageRepository: Repository<UsageMetrics>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  /**
   * 사용량을 기록합니다.
   */
  async recordUsage(
    usageType: UsageType,
    options: {
      userId?: string;
      organizationId?: string;
      tokenUsage?: number;
      dataSize?: number;
      cost?: number;
      metadata?: UsageMetadata;
    } = {},
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 기존 기록이 있는지 확인
    const existingUsage = await this.usageRepository.findOne({
      where: {
        usageType,
        date: today,
        ...(options.userId && { userId: options.userId }),
        ...(options.organizationId && {
          organizationId: options.organizationId,
        }),
      },
    });

    if (existingUsage) {
      // 기존 기록 업데이트
      await this.usageRepository.update(existingUsage.id, {
        count: existingUsage.count + 1,
        tokenUsage: existingUsage.tokenUsage + (options.tokenUsage || 0),
        dataSize: existingUsage.dataSize + (options.dataSize || 0),
        cost: existingUsage.cost + (options.cost || 0),
        metadata: { ...existingUsage.metadata, ...options.metadata },
      });
    } else {
      // 새 기록 생성
      await this.usageRepository.save({
        usageType,
        date: today,
        userId: options.userId,
        organizationId: options.organizationId,
        count: 1,
        tokenUsage: options.tokenUsage || 0,
        dataSize: options.dataSize || 0,
        cost: options.cost || 0,
        metadata: options.metadata || {},
      });
    }
  }

  /**
   * 조직의 사용량 제한을 확인합니다.
   */
  async checkUsageLimits(
    organizationId: string,
    usageType: UsageType,
  ): Promise<UsageLimitCheckResult> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });

    if (!organization) {
      return { allowed: false, reason: '조직을 찾을 수 없습니다.' };
    }

    const limits = this.getUsageLimits(organization.subscriptionTier);
    const currentUsage = await this.getCurrentMonthUsage(organizationId);

    switch (usageType) {
      case UsageType.DOCUMENT_UPLOAD:
        const documentCount = currentUsage.documentUploads || 0;
        if (documentCount >= limits.maxDocuments) {
          return {
            allowed: false,
            reason: `문서 업로드 한도 초과 (${documentCount}/${limits.maxDocuments})`,
            usage: currentUsage,
            limits,
          };
        }
        break;

      case UsageType.DOCUMENT_SEARCH:
        const searchCount = currentUsage.documentSearches || 0;
        if (searchCount >= limits.maxQueriesPerMonth) {
          return {
            allowed: false,
            reason: `검색 한도 초과 (${searchCount}/${limits.maxQueriesPerMonth})`,
            usage: currentUsage,
            limits,
          };
        }
        break;
    }

    return { allowed: true, usage: currentUsage, limits };
  }

  /**
   * 구독 티어별 사용량 제한을 반환합니다.
   */
  private getUsageLimits(tier: SubscriptionTier): UsageLimits {
    switch (tier) {
      case SubscriptionTier.FREE:
        return {
          maxDocuments: 10,
          maxQueriesPerMonth: 100,
          maxStorageGB: 1,
          maxUsersPerOrg: 3,
        };
      case SubscriptionTier.BASIC:
        return {
          maxDocuments: 100,
          maxQueriesPerMonth: 1000,
          maxStorageGB: 10,
          maxUsersPerOrg: 10,
        };
      case SubscriptionTier.PROFESSIONAL:
        return {
          maxDocuments: 1000,
          maxQueriesPerMonth: 10000,
          maxStorageGB: 100,
          maxUsersPerOrg: 50,
        };
      case SubscriptionTier.ENTERPRISE:
        return {
          maxDocuments: -1, // 무제한
          maxQueriesPerMonth: -1,
          maxStorageGB: -1,
          maxUsersPerOrg: -1,
        };
      default:
        return this.getUsageLimits(SubscriptionTier.FREE);
    }
  }

  /**
   * 현재 월의 사용량을 조회합니다.
   */
  async getCurrentMonthUsage(organizationId: string): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageData = await this.usageRepository.find({
      where: {
        organizationId,
        date: Between(startOfMonth, endOfMonth),
      },
    });

    // 사용량 집계
    const aggregated = usageData.reduce((acc, usage) => {
      const type = usage.usageType;
      acc[type] = (acc[type] || 0) + usage.count;
      acc.totalTokens = (acc.totalTokens || 0) + usage.tokenUsage;
      acc.totalDataSize = (acc.totalDataSize || 0) + usage.dataSize;
      acc.totalCost = (acc.totalCost || 0) + usage.cost;
      return acc;
    }, {} as any);

    return {
      documentUploads: aggregated[UsageType.DOCUMENT_UPLOAD] || 0,
      documentSearches: aggregated[UsageType.DOCUMENT_SEARCH] || 0,
      chatMessages: aggregated[UsageType.CHAT_MESSAGE] || 0,
      aiResponses: aggregated[UsageType.AI_RESPONSE] || 0,
      embeddingGenerations: aggregated[UsageType.EMBEDDING_GENERATION] || 0,
      totalTokens: aggregated.totalTokens || 0,
      totalDataSize: aggregated.totalDataSize || 0,
      totalCost: aggregated.totalCost || 0,
      period: {
        start: startOfMonth,
        end: endOfMonth,
      },
    };
  }

  /**
   * 조직의 사용량 통계를 조회합니다.
   */
  async getUsageStats(
    organizationId: string,
    period: 'day' | 'week' | 'month' | 'year' = 'month',
  ): Promise<any> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const usageData = await this.usageRepository.find({
      where: {
        organizationId,
        date: Between(startDate, now),
      },
      order: { date: 'ASC' },
    });

    // 일별 사용량 그룹화
    const dailyUsage = usageData.reduce((acc, usage) => {
      const dateKey = usage.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          documentUploads: 0,
          documentSearches: 0,
          chatMessages: 0,
          aiResponses: 0,
          embeddingGenerations: 0,
          totalTokens: 0,
          totalCost: 0,
        };
      }

      const dayData = acc[dateKey];
      dayData[usage.usageType] = (dayData[usage.usageType] || 0) + usage.count;
      dayData.totalTokens += usage.tokenUsage;
      dayData.totalCost += usage.cost;

      return acc;
    }, {} as any);

    return {
      period,
      startDate,
      endDate: now,
      dailyUsage: Object.values(dailyUsage),
      totalUsage: await this.getCurrentMonthUsage(organizationId),
    };
  }

  /**
   * 사용량 제한 위반 시 알림을 생성합니다.
   */
  async createUsageAlert(
    organizationId: string,
    usageType: UsageType,
    currentUsage: number,
    limit: number,
  ): Promise<void> {
    const alertThresholds = [0.8, 0.9, 1.0]; // 80%, 90%, 100%
    const usagePercentage = currentUsage / limit;

    for (const threshold of alertThresholds) {
      if (usagePercentage >= threshold) {
        // 알림 로직 구현 (이메일, 슬랙 등)
        console.log(
          `🚨 사용량 알림: ${organizationId} - ${usageType} ${(usagePercentage * 100).toFixed(0)}% 사용`,
        );

        // 실제 구현에서는 이메일 서비스나 알림 서비스를 호출
        break;
      }
    }
  }
}
