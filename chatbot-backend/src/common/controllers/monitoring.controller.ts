import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PerformanceMetricsService } from '../services/performance-metrics.service';

@Controller('monitoring')
@UseGuards(JwtAuthGuard)
export class MonitoringController {
  constructor(
    private readonly performanceMetricsService: PerformanceMetricsService,
  ) {}

  /**
   * 현재 시스템 상태 조회
   */
  @Get('status')
  async getSystemStatus() {
    try {
      const metrics = this.performanceMetricsService.getCurrentMetrics();
      const summary = this.performanceMetricsService.getPerformanceSummary();

      return {
        status: 'healthy',
        timestamp: Date.now(),
        metrics,
        summary,
      };
    } catch (error) {
      throw new HttpException(
        '시스템 상태를 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 실시간 메트릭 조회
   */
  @Get('metrics/current')
  async getCurrentMetrics() {
    try {
      return this.performanceMetricsService.getCurrentMetrics();
    } catch (error) {
      throw new HttpException(
        '현재 메트릭을 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 메트릭 히스토리 조회
   */
  @Get('metrics/history')
  async getMetricsHistory(@Query('hours') hours?: string) {
    try {
      const hoursNum = hours ? parseInt(hours, 10) : 24;

      if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) {
        // 최대 7일
        throw new HttpException(
          '시간 범위는 1-168시간 사이여야 합니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      return this.performanceMetricsService.getMetricsHistory(hoursNum);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '메트릭 히스토리를 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 성능 요약 통계
   */
  @Get('summary')
  async getPerformanceSummary() {
    try {
      const summary = this.performanceMetricsService.getPerformanceSummary();

      if (!summary) {
        return {
          message: '충분한 데이터가 수집되지 않았습니다.',
          timestamp: Date.now(),
        };
      }

      return summary;
    } catch (error) {
      throw new HttpException(
        '성능 요약을 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 시스템 메트릭 강제 수집
   */
  @Post('collect/system')
  async collectSystemMetrics() {
    try {
      const metrics =
        await this.performanceMetricsService.collectSystemMetrics();
      return {
        message: '시스템 메트릭이 수집되었습니다.',
        metrics,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new HttpException(
        '시스템 메트릭 수집에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 애플리케이션 메트릭 강제 수집
   */
  @Post('collect/application')
  async collectApplicationMetrics() {
    try {
      const metrics =
        await this.performanceMetricsService.collectApplicationMetrics();
      return {
        message: '애플리케이션 메트릭이 수집되었습니다.',
        metrics,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new HttpException(
        '애플리케이션 메트릭 수집에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 알림 해결 처리
   */
  @Post('alerts/:alertId/resolve')
  async resolveAlert(@Param('alertId') alertId: string) {
    try {
      this.performanceMetricsService.resolveAlert(alertId);
      return {
        message: '알림이 해결되었습니다.',
        alertId,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new HttpException(
        '알림 해결 처리에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 헬스체크 엔드포인트
   */
  @Get('health')
  async healthCheck() {
    try {
      const metrics = this.performanceMetricsService.getCurrentMetrics();
      const alerts = metrics.alerts || [];
      const criticalAlerts = alerts.filter(
        (alert) => alert.severity === 'critical',
      );

      return {
        status: criticalAlerts.length > 0 ? 'unhealthy' : 'healthy',
        timestamp: Date.now(),
        checks: {
          database: 'healthy', // 실제 구현에서는 DB 연결 체크
          cache: 'healthy', // 실제 구현에서는 캐시 연결 체크
          storage: 'healthy', // 실제 구현에서는 스토리지 체크
        },
        alerts: {
          total: alerts.length,
          critical: criticalAlerts.length,
        },
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: Date.now(),
        error: '헬스체크 실행 중 오류가 발생했습니다.',
      };
    }
  }

  /**
   * 시스템 정보 조회
   */
  @Get('system-info')
  async getSystemInfo() {
    try {
      const os = require('os');

      return {
        platform: os.platform(),
        architecture: os.arch(),
        hostname: os.hostname(),
        nodeVersion: process.version,
        uptime: {
          system: os.uptime(),
          process: process.uptime(),
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
        },
        cpu: {
          model: os.cpus()[0]?.model || 'Unknown',
          cores: os.cpus().length,
          speed: os.cpus()[0]?.speed || 0,
        },
        loadAverage: os.loadavg(),
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new HttpException(
        '시스템 정보를 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 성능 테스트 엔드포인트
   */
  @Post('test/load')
  async performLoadTest(@Query('duration') duration?: string) {
    try {
      const durationMs = duration ? parseInt(duration, 10) * 1000 : 10000; // 기본 10초

      if (isNaN(durationMs) || durationMs < 1000 || durationMs > 60000) {
        throw new HttpException(
          '테스트 시간은 1-60초 사이여야 합니다.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const startTime = Date.now();
      let operations = 0;

      // CPU 집약적 작업 시뮬레이션
      const endTime = startTime + durationMs;
      while (Date.now() < endTime) {
        Math.random() * Math.random();
        operations++;
      }

      const actualDuration = Date.now() - startTime;

      return {
        message: '부하 테스트가 완료되었습니다.',
        results: {
          duration: actualDuration,
          operations,
          operationsPerSecond: Math.round(operations / (actualDuration / 1000)),
        },
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        '부하 테스트 실행에 실패했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
