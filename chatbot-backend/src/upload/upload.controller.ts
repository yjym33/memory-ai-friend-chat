import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileSecurityService } from './services/file-security.service';
import { FileCleanupService } from './services/file-cleanup.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs/promises';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(
    private readonly uploadService: UploadService,
    private readonly fileSecurityService: FileSecurityService,
    private readonly fileCleanupService: FileCleanupService,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          // 한글 파일명 인코딩 문제 해결
          const originalName = Buffer.from(
            file.originalname,
            'latin1',
          ).toString('utf8');
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extension = extname(originalName);
          callback(null, `${uniqueSuffix}${extension}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (
          !file.originalname.match(
            /\.(jpg|jpeg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/,
          )
        ) {
          return callback(
            new BadRequestException('지원하지 않는 파일 형식입니다.'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB로 제한 수정
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      console.error('❌ 파일이 업로드되지 않음');
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 파일명 인코딩 수정
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );

    console.log('✅ 파일 업로드 완료:', {
      originalName: originalName, // 수정된 파일명
      savedAs: file.filename,
      path: file.path,
      size: file.size,
    });

    // 수정된 파일명으로 서비스 호출
    return this.uploadService.saveFile({
      ...file,
      originalname: originalName,
    });
  }

  /**
   * 파일 시스템 상태 조회 (관리자용)
   */
  @Get('stats')
  async getUploadStats() {
    try {
      const [cleanupStats, processMemory] = await Promise.all([
        this.fileCleanupService.getCleanupStats(),
        process.memoryUsage(),
      ]);

      return {
        fileSystem: {
          uploadDirSizeMB: Math.round(cleanupStats.uploadDirSize / 1024 / 1024),
          tempDirSizeMB: Math.round(cleanupStats.tempDirSize / 1024 / 1024),
          quarantineDirSizeMB: Math.round(
            cleanupStats.quarantineDirSize / 1024 / 1024,
          ),
          totalFiles: cleanupStats.totalFiles,
        },
        memory: {
          rssKB: Math.round(processMemory.rss / 1024),
          heapUsedKB: Math.round(processMemory.heapUsed / 1024),
          heapTotalKB: Math.round(processMemory.heapTotal / 1024),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('업로드 통계 조회 실패:', error);
      throw new HttpException(
        '업로드 통계를 조회할 수 없습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 강제 파일 정리 실행 (관리자용)
   */
  @Delete('cleanup')
  async forceCleanup() {
    try {
      this.logger.log('🔥 관리자에 의한 강제 파일 정리 시작');

      const stats = await this.fileCleanupService.forceCleanup();

      return {
        message: '파일 정리가 완료되었습니다.',
        stats: {
          filesDeleted: stats.filesDeleted,
          bytesFreedMB: Math.round(stats.bytesFreed / 1024 / 1024),
          duration: stats.duration,
          errors: stats.errors,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('강제 파일 정리 실패:', error);
      throw new HttpException(
        '파일 정리 중 오류가 발생했습니다.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
