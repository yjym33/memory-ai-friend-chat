import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CleanupStats {
  filesScanned: number;
  filesDeleted: number;
  bytesFreed: number;
  errors: number;
  duration: number;
}

@Injectable()
export class FileCleanupService {
  private readonly logger = new Logger(FileCleanupService.name);
  private readonly uploadDir: string;
  private readonly tempDir: string;
  private readonly quarantineDir: string;
  private readonly maxAge: number; // milliseconds
  private readonly maxTempAge: number; // milliseconds for temp files

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.tempDir = path.join(process.cwd(), 'uploads', 'temp');
    this.quarantineDir = path.join(process.cwd(), 'quarantine');

    // 환경 설정
    this.maxAge =
      (this.configService.get<number>('FILE_MAX_AGE_DAYS') || 90) *
      24 *
      60 *
      60 *
      1000; // 90일
    this.maxTempAge =
      (this.configService.get<number>('TEMP_FILE_MAX_AGE_HOURS') || 24) *
      60 *
      60 *
      1000; // 24시간
  }

  /**
   * 매일 새벽 2시에 파일 정리 작업 실행
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledCleanup(): Promise<void> {
    this.logger.log('🧹 예약된 파일 정리 작업 시작');

    try {
      const stats = await this.performFullCleanup();

      this.logger.log(
        `✅ 파일 정리 완료: ${stats.filesDeleted}개 파일 삭제, ` +
          `${Math.round(stats.bytesFreed / 1024 / 1024)}MB 공간 확보 ` +
          `(${stats.duration}ms 소요)`,
      );
    } catch (error) {
      this.logger.error('파일 정리 작업 실패:', error);
    }
  }

  /**
   * 매시간 임시 파일 정리
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupTempFiles(): Promise<void> {
    this.logger.debug('🔄 임시 파일 정리 시작');

    try {
      const stats = await this.cleanupDirectory(this.tempDir, this.maxTempAge);

      if (stats.filesDeleted > 0) {
        this.logger.log(
          `🗑️ 임시 파일 ${stats.filesDeleted}개 정리 완료 ` +
            `(${Math.round(stats.bytesFreed / 1024)}KB 공간 확보)`,
        );
      }
    } catch (error) {
      this.logger.error('임시 파일 정리 실패:', error);
    }
  }

  /**
   * 전체 파일 정리 작업 수행
   */
  async performFullCleanup(): Promise<CleanupStats> {
    const startTime = Date.now();
    let totalStats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // 1. 임시 파일 정리
      const tempStats = await this.cleanupDirectory(
        this.tempDir,
        this.maxTempAge,
      );
      this.mergeStats(totalStats, tempStats);

      // 2. 오래된 업로드 파일 정리
      const uploadStats = await this.cleanupDirectory(
        this.uploadDir,
        this.maxAge,
      );
      this.mergeStats(totalStats, uploadStats);

      // 3. 격리 파일 정리 (더 짧은 보존 기간)
      const quarantineStats = await this.cleanupDirectory(
        this.quarantineDir,
        this.maxTempAge,
      );
      this.mergeStats(totalStats, quarantineStats);

      // 4. 빈 디렉토리 정리
      await this.cleanupEmptyDirectories(this.uploadDir);
      await this.cleanupEmptyDirectories(this.quarantineDir);

      // 5. 고아 파일 검사 (데이터베이스에 기록되지 않은 파일)
      const orphanStats = await this.cleanupOrphanFiles();
      this.mergeStats(totalStats, orphanStats);

      totalStats.duration = Date.now() - startTime;
      return totalStats;
    } catch (error) {
      this.logger.error('전체 파일 정리 실패:', error);
      totalStats.errors++;
      totalStats.duration = Date.now() - startTime;
      return totalStats;
    }
  }

  /**
   * 특정 디렉토리의 오래된 파일들을 정리합니다
   */
  private async cleanupDirectory(
    dirPath: string,
    maxAge: number,
  ): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: 0,
      duration: 0,
    };

    try {
      // 디렉토리 존재 확인
      await fs.access(dirPath);
    } catch {
      // 디렉토리가 없으면 스킵
      return stats;
    }

    const startTime = Date.now();
    const cutoffTime = Date.now() - maxAge;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        stats.filesScanned++;

        try {
          if (entry.isFile()) {
            const stat = await fs.stat(fullPath);

            // 파일이 충분히 오래되었는지 확인
            if (stat.mtime.getTime() < cutoffTime) {
              await fs.unlink(fullPath);
              stats.filesDeleted++;
              stats.bytesFreed += stat.size;

              this.logger.debug(
                `삭제된 파일: ${fullPath} (크기: ${stat.size}바이트)`,
              );
            }
          } else if (entry.isDirectory()) {
            // 하위 디렉토리 재귀 처리
            const subStats = await this.cleanupDirectory(fullPath, maxAge);
            this.mergeStats(stats, subStats);
          }
        } catch (error) {
          this.logger.error(`파일 처리 실패: ${fullPath}`, error);
          stats.errors++;
        }
      }

      stats.duration = Date.now() - startTime;
      return stats;
    } catch (error) {
      this.logger.error(`디렉토리 정리 실패: ${dirPath}`, error);
      stats.errors++;
      stats.duration = Date.now() - startTime;
      return stats;
    }
  }

  /**
   * 빈 디렉토리들을 정리합니다
   */
  private async cleanupEmptyDirectories(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const subDirPath = path.join(dirPath, entry.name);

          // 재귀적으로 하위 디렉토리 정리
          await this.cleanupEmptyDirectories(subDirPath);

          // 디렉토리가 비어있으면 삭제
          try {
            const subEntries = await fs.readdir(subDirPath);
            if (subEntries.length === 0) {
              await fs.rmdir(subDirPath);
              this.logger.debug(`빈 디렉토리 삭제: ${subDirPath}`);
            }
          } catch {
            // 디렉토리가 비어있지 않거나 다른 이유로 삭제 실패
          }
        }
      }
    } catch (error) {
      this.logger.error(`빈 디렉토리 정리 실패: ${dirPath}`, error);
    }
  }

  /**
   * 데이터베이스에 기록되지 않은 고아 파일들을 찾아 정리합니다
   * (실제 구현시에는 데이터베이스 연동 필요)
   */
  private async cleanupOrphanFiles(): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesScanned: 0,
      filesDeleted: 0,
      bytesFreed: 0,
      errors: 0,
      duration: 0,
    };

    // TODO: 실제 구현시에는 데이터베이스에서 파일 목록을 가져와서
    // 실제 파일 시스템과 비교하여 고아 파일을 찾아야 함

    this.logger.debug('고아 파일 검사는 추후 데이터베이스 연동 후 구현 예정');

    return stats;
  }

  /**
   * 통계 정보를 병합합니다
   */
  private mergeStats(target: CleanupStats, source: CleanupStats): void {
    target.filesScanned += source.filesScanned;
    target.filesDeleted += source.filesDeleted;
    target.bytesFreed += source.bytesFreed;
    target.errors += source.errors;
  }

  /**
   * 특정 파일을 즉시 삭제합니다
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(filePath);
      await fs.unlink(filePath);

      this.logger.log(`파일 삭제: ${filePath} (${stat.size}바이트)`);
      return true;
    } catch (error) {
      this.logger.error(`파일 삭제 실패: ${filePath}`, error);
      return false;
    }
  }

  /**
   * 임시 디렉토리를 생성하고 경로를 반환합니다
   */
  async createTempDirectory(): Promise<string> {
    const tempSubDir = path.join(
      this.tempDir,
      `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    );

    try {
      await fs.mkdir(tempSubDir, { recursive: true });
      return tempSubDir;
    } catch (error) {
      this.logger.error(`임시 디렉토리 생성 실패: ${tempSubDir}`, error);
      throw new Error('임시 디렉토리를 생성할 수 없습니다.');
    }
  }

  /**
   * 파일 정리 통계를 조회합니다
   */
  async getCleanupStats(): Promise<{
    uploadDirSize: number;
    tempDirSize: number;
    quarantineDirSize: number;
    totalFiles: number;
  }> {
    try {
      const [uploadSize, tempSize, quarantineSize] = await Promise.all([
        this.getDirectorySize(this.uploadDir),
        this.getDirectorySize(this.tempDir),
        this.getDirectorySize(this.quarantineDir),
      ]);

      const totalFiles =
        (await this.countFiles(this.uploadDir)) +
        (await this.countFiles(this.tempDir)) +
        (await this.countFiles(this.quarantineDir));

      return {
        uploadDirSize: uploadSize,
        tempDirSize: tempSize,
        quarantineDirSize: quarantineSize,
        totalFiles,
      };
    } catch (error) {
      this.logger.error('파일 통계 조회 실패:', error);
      return {
        uploadDirSize: 0,
        tempDirSize: 0,
        quarantineDirSize: 0,
        totalFiles: 0,
      };
    }
  }

  /**
   * 디렉토리의 총 크기를 계산합니다
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    try {
      let totalSize = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isFile()) {
          const stat = await fs.stat(fullPath);
          totalSize += stat.size;
        } else if (entry.isDirectory()) {
          totalSize += await this.getDirectorySize(fullPath);
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * 디렉토리의 파일 개수를 계산합니다
   */
  private async countFiles(dirPath: string): Promise<number> {
    try {
      let fileCount = 0;
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          fileCount++;
        } else if (entry.isDirectory()) {
          const fullPath = path.join(dirPath, entry.name);
          fileCount += await this.countFiles(fullPath);
        }
      }

      return fileCount;
    } catch {
      return 0;
    }
  }

  /**
   * 강제로 정리 작업을 실행합니다 (관리자용)
   */
  async forceCleanup(): Promise<CleanupStats> {
    this.logger.log('🔥 강제 파일 정리 작업 시작');

    const stats = await this.performFullCleanup();

    this.logger.log(
      `🧹 강제 정리 완료: ${stats.filesDeleted}개 파일 삭제, ` +
        `${Math.round(stats.bytesFreed / 1024 / 1024)}MB 공간 확보`,
    );

    return stats;
  }
}
