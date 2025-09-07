import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as os from 'os';
import * as fs from 'fs/promises';

export interface SystemMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
    heap: {
      total: number;
      used: number;
      external: number;
    };
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
}

export interface ApplicationMetrics {
  timestamp: number;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
    requestsPerSecond: number;
  };
  database: {
    connections: number;
    queries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    size: number;
  };
  errors: {
    total: number;
    rate: number;
    types: Record<string, number>;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'response_time' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

@Injectable()
export class PerformanceMetricsService {
  private readonly logger = new Logger(PerformanceMetricsService.name);
  private readonly metricsHistory: SystemMetrics[] = [];
  private readonly appMetricsHistory: ApplicationMetrics[] = [];
  private readonly alerts: PerformanceAlert[] = [];
  private readonly maxHistorySize: number;

  // 성능 카운터
  private requestCount = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private totalResponseTime = 0;
  private queryCount = 0;
  private totalQueryTime = 0;
  private slowQueryCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private errorCount = 0;
  private errorTypes: Record<string, number> = {};

  // 성능 임계값
  private readonly thresholds = {
    cpu: 80, // 80%
    memory: 85, // 85%
    disk: 90, // 90%
    responseTime: 2000, // 2초
    errorRate: 5, // 5%
  };

  constructor(private configService: ConfigService) {
    this.maxHistorySize =
      this.configService.get<number>('METRICS_HISTORY_SIZE') || 1000;
    this.startMetricsCollection();
  }

  /**
   * 메트릭 수집 시작
   */
  private startMetricsCollection() {
    this.logger.log('📊 성능 메트릭 수집 시작');

    // 초기 메트릭 수집
    this.collectSystemMetrics();
    this.collectApplicationMetrics();
  }

  /**
   * 매분마다 시스템 메트릭 수집
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const cpuUsage = await this.getCpuUsage();
      const memoryInfo = this.getMemoryInfo();
      const diskInfo = await this.getDiskInfo();
      const networkInfo = this.getNetworkInfo();

      const metrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: {
          usage: cpuUsage,
          loadAverage: os.loadavg(),
          cores: os.cpus().length,
        },
        memory: memoryInfo,
        disk: diskInfo,
        network: networkInfo,
      };

      // 히스토리에 추가
      this.metricsHistory.push(metrics);
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory.shift();
      }

      // 알림 체크
      this.checkSystemAlerts(metrics);

      return metrics;
    } catch (error) {
      this.logger.error('시스템 메트릭 수집 실패:', error);
      throw error;
    }
  }

  /**
   * 매분마다 애플리케이션 메트릭 수집
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    try {
      const now = Date.now();
      const requestsPerSecond = this.requestCount / 60; // 1분간 평균
      const averageResponseTime =
        this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
      const averageQueryTime =
        this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0;
      const hitRate =
        this.cacheHits + this.cacheMisses > 0
          ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
          : 0;
      const errorRate =
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0;

      const metrics: ApplicationMetrics = {
        timestamp: now,
        requests: {
          total: this.requestCount,
          successful: this.successfulRequests,
          failed: this.failedRequests,
          averageResponseTime,
          requestsPerSecond,
        },
        database: {
          connections: await this.getDatabaseConnections(),
          queries: this.queryCount,
          averageQueryTime,
          slowQueries: this.slowQueryCount,
        },
        cache: {
          hits: this.cacheHits,
          misses: this.cacheMisses,
          hitRate,
          size: await this.getCacheSize(),
        },
        errors: {
          total: this.errorCount,
          rate: errorRate,
          types: { ...this.errorTypes },
        },
      };

      // 히스토리에 추가
      this.appMetricsHistory.push(metrics);
      if (this.appMetricsHistory.length > this.maxHistorySize) {
        this.appMetricsHistory.shift();
      }

      // 알림 체크
      this.checkApplicationAlerts(metrics);

      // 카운터 리셋
      this.resetCounters();

      return metrics;
    } catch (error) {
      this.logger.error('애플리케이션 메트릭 수집 실패:', error);
      throw error;
    }
  }

  /**
   * CPU 사용률 계산
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();

      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const usage =
          100 - Math.floor((100 * idleDifference) / totalDifference);
        resolve(usage);
      }, 100);
    });
  }

  private cpuAverage() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        total += cpu.times[type as keyof typeof cpu.times];
      }
      idle += cpu.times.idle;
    });

    return { idle: idle / cpus.length, total: total / cpus.length };
  }

  /**
   * 메모리 정보 수집
   */
  private getMemoryInfo() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;

    const heapStats = process.memoryUsage();

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      usage: memoryUsage,
      heap: {
        total: heapStats.heapTotal,
        used: heapStats.heapUsed,
        external: heapStats.external,
      },
    };
  }

  /**
   * 디스크 정보 수집
   */
  private async getDiskInfo() {
    try {
      const stats = await fs.stat(process.cwd());
      // 실제 환경에서는 더 정확한 디스크 사용량 계산 필요
      return {
        total: 100 * 1024 * 1024 * 1024, // 100GB (예시)
        used: 50 * 1024 * 1024 * 1024, // 50GB (예시)
        free: 50 * 1024 * 1024 * 1024, // 50GB (예시)
        usage: 50, // 50% (예시)
      };
    } catch (error) {
      return {
        total: 0,
        used: 0,
        free: 0,
        usage: 0,
      };
    }
  }

  /**
   * 네트워크 정보 수집
   */
  private getNetworkInfo() {
    const networkInterfaces = os.networkInterfaces();
    // 실제 환경에서는 네트워크 트래픽 모니터링 구현 필요
    return {
      bytesReceived: 0,
      bytesSent: 0,
    };
  }

  /**
   * 데이터베이스 연결 수 조회
   */
  private async getDatabaseConnections(): Promise<number> {
    // 실제 구현에서는 데이터베이스 연결 풀에서 정보 가져오기
    return 5; // 예시
  }

  /**
   * 캐시 크기 조회
   */
  private async getCacheSize(): Promise<number> {
    // 실제 구현에서는 캐시 서비스에서 정보 가져오기
    return 1024 * 1024; // 1MB (예시)
  }

  /**
   * 시스템 알림 체크
   */
  private checkSystemAlerts(metrics: SystemMetrics) {
    // CPU 사용률 체크
    if (metrics.cpu.usage > this.thresholds.cpu) {
      this.createAlert(
        'cpu',
        'high',
        `CPU 사용률이 높습니다: ${metrics.cpu.usage}%`,
        metrics.cpu.usage,
        this.thresholds.cpu,
      );
    }

    // 메모리 사용률 체크
    if (metrics.memory.usage > this.thresholds.memory) {
      this.createAlert(
        'memory',
        'high',
        `메모리 사용률이 높습니다: ${metrics.memory.usage.toFixed(1)}%`,
        metrics.memory.usage,
        this.thresholds.memory,
      );
    }

    // 디스크 사용률 체크
    if (metrics.disk.usage > this.thresholds.disk) {
      this.createAlert(
        'disk',
        'critical',
        `디스크 사용률이 높습니다: ${metrics.disk.usage}%`,
        metrics.disk.usage,
        this.thresholds.disk,
      );
    }
  }

  /**
   * 애플리케이션 알림 체크
   */
  private checkApplicationAlerts(metrics: ApplicationMetrics) {
    // 응답 시간 체크
    if (metrics.requests.averageResponseTime > this.thresholds.responseTime) {
      this.createAlert(
        'response_time',
        'medium',
        `평균 응답 시간이 느립니다: ${metrics.requests.averageResponseTime}ms`,
        metrics.requests.averageResponseTime,
        this.thresholds.responseTime,
      );
    }

    // 에러율 체크
    if (metrics.errors.rate > this.thresholds.errorRate) {
      this.createAlert(
        'error_rate',
        'high',
        `에러율이 높습니다: ${metrics.errors.rate.toFixed(1)}%`,
        metrics.errors.rate,
        this.thresholds.errorRate,
      );
    }
  }

  /**
   * 알림 생성
   */
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    message: string,
    value: number,
    threshold: number,
  ) {
    const alertId = `${type}_${Date.now()}`;

    // 중복 알림 방지 (같은 타입의 미해결 알림이 있으면 스킵)
    const existingAlert = this.alerts.find(
      (alert) => alert.type === type && !alert.resolved,
    );

    if (existingAlert) {
      return;
    }

    const alert: PerformanceAlert = {
      id: alertId,
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);
    this.logger.warn(`🚨 성능 알림: ${message}`);

    // 알림 히스토리 관리 (최대 100개)
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * 카운터 리셋
   */
  private resetCounters() {
    this.requestCount = 0;
    this.successfulRequests = 0;
    this.failedRequests = 0;
    this.totalResponseTime = 0;
    this.queryCount = 0;
    this.totalQueryTime = 0;
    this.slowQueryCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.errorCount = 0;
    this.errorTypes = {};
  }

  /**
   * 요청 메트릭 기록
   */
  recordRequest(responseTime: number, success: boolean) {
    this.requestCount++;
    this.totalResponseTime += responseTime;

    if (success) {
      this.successfulRequests++;
    } else {
      this.failedRequests++;
    }
  }

  /**
   * 쿼리 메트릭 기록
   */
  recordQuery(queryTime: number, isSlow: boolean = false) {
    this.queryCount++;
    this.totalQueryTime += queryTime;

    if (isSlow) {
      this.slowQueryCount++;
    }
  }

  /**
   * 캐시 메트릭 기록
   */
  recordCacheHit() {
    this.cacheHits++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
  }

  /**
   * 에러 메트릭 기록
   */
  recordError(errorType: string) {
    this.errorCount++;
    this.errorTypes[errorType] = (this.errorTypes[errorType] || 0) + 1;
  }

  /**
   * 현재 메트릭 조회
   */
  getCurrentMetrics() {
    const latestSystem = this.metricsHistory[this.metricsHistory.length - 1];
    const latestApp = this.appMetricsHistory[this.appMetricsHistory.length - 1];

    return {
      system: latestSystem,
      application: latestApp,
      alerts: this.alerts.filter((alert) => !alert.resolved),
      timestamp: Date.now(),
    };
  }

  /**
   * 메트릭 히스토리 조회
   */
  getMetricsHistory(hours: number = 24) {
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;

    return {
      system: this.metricsHistory.filter((m) => m.timestamp > cutoffTime),
      application: this.appMetricsHistory.filter(
        (m) => m.timestamp > cutoffTime,
      ),
      alerts: this.alerts.filter((a) => a.timestamp > cutoffTime),
    };
  }

  /**
   * 알림 해결 처리
   */
  resolveAlert(alertId: string) {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.logger.log(`✅ 알림 해결: ${alert.message}`);
    }
  }

  /**
   * 성능 요약 통계
   */
  getPerformanceSummary() {
    const recentMetrics = this.getMetricsHistory(1); // 최근 1시간

    if (
      recentMetrics.system.length === 0 ||
      recentMetrics.application.length === 0
    ) {
      return null;
    }

    const avgCpu =
      recentMetrics.system.reduce((sum, m) => sum + m.cpu.usage, 0) /
      recentMetrics.system.length;
    const avgMemory =
      recentMetrics.system.reduce((sum, m) => sum + m.memory.usage, 0) /
      recentMetrics.system.length;
    const avgResponseTime =
      recentMetrics.application.reduce(
        (sum, m) => sum + m.requests.averageResponseTime,
        0,
      ) / recentMetrics.application.length;
    const totalRequests = recentMetrics.application.reduce(
      (sum, m) => sum + m.requests.total,
      0,
    );
    const totalErrors = recentMetrics.application.reduce(
      (sum, m) => sum + m.errors.total,
      0,
    );
    const errorRate =
      totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    return {
      period: '1시간',
      averages: {
        cpu: Math.round(avgCpu * 10) / 10,
        memory: Math.round(avgMemory * 10) / 10,
        responseTime: Math.round(avgResponseTime),
      },
      totals: {
        requests: totalRequests,
        errors: totalErrors,
        errorRate: Math.round(errorRate * 10) / 10,
      },
      alerts: {
        total: recentMetrics.alerts.length,
        unresolved: recentMetrics.alerts.filter((a) => !a.resolved).length,
      },
    };
  }
}
