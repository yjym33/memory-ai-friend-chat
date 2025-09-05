import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

interface FileValidationResult {
  isValid: boolean;
  reason?: string;
  risk?: 'low' | 'medium' | 'high';
  details?: any;
}

interface FileScanResult {
  isClean: boolean;
  threats?: string[];
  scanEngine?: string;
  scanTime: number;
}

@Injectable()
export class FileSecurityService {
  private readonly logger = new Logger(FileSecurityService.name);
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly blockedExtensions: string[];

  // 위험한 파일 시그니처 (바이트 패턴)
  private readonly malwareSignatures = new Map<string, Buffer[]>([
    [
      'PE_HEADER',
      [Buffer.from([0x4d, 0x5a]), Buffer.from([0x50, 0x45, 0x00, 0x00])],
    ],
    [
      'SCRIPT_TAGS',
      [Buffer.from('<script', 'utf8'), Buffer.from('javascript:', 'utf8')],
    ],
    [
      'MACRO_VIRUS',
      [Buffer.from('Auto_Open', 'utf8'), Buffer.from('Workbook_Open', 'utf8')],
    ],
    ['PHP_CODE', [Buffer.from('<?php', 'utf8'), Buffer.from('eval(', 'utf8')]],
  ]);

  constructor(private configService: ConfigService) {
    this.maxFileSize =
      this.configService.get<number>('MAX_FILE_SIZE') || 100 * 1024 * 1024; // 100MB
    this.allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    this.blockedExtensions = [
      '.exe',
      '.bat',
      '.cmd',
      '.com',
      '.pif',
      '.scr',
      '.vbs',
      '.js',
      '.jar',
      '.app',
      '.deb',
      '.pkg',
      '.dmg',
      '.msi',
      '.rpm',
      '.run',
      '.ipa',
      '.apk',
    ];
  }

  /**
   * 파일의 전체적인 보안 검증을 수행합니다
   */
  async validateFileSecurity(
    filePath: string,
    originalName: string,
  ): Promise<FileValidationResult> {
    try {
      const startTime = Date.now();

      // 1. 기본 파일 검증
      const basicValidation = await this.validateBasicFileSecurity(
        filePath,
        originalName,
      );
      if (!basicValidation.isValid) {
        return basicValidation;
      }

      // 2. 파일 내용 검증
      const contentValidation = await this.validateFileContent(filePath);
      if (!contentValidation.isValid) {
        return contentValidation;
      }

      // 3. 바이러스 스캔 (간단한 시그니처 기반)
      const scanResult = await this.scanFileForThreats(filePath);
      if (!scanResult.isClean) {
        return {
          isValid: false,
          reason: `보안 위험 발견: ${scanResult.threats?.join(', ')}`,
          risk: 'high',
          details: scanResult,
        };
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `파일 보안 검증 완료: ${originalName} (${processingTime}ms)`,
      );

      return {
        isValid: true,
        risk: 'low',
        details: {
          scanTime: processingTime,
          scanEngine: 'internal',
        },
      };
    } catch (error) {
      this.logger.error(`파일 보안 검증 실패: ${originalName}`, error);
      return {
        isValid: false,
        reason: '파일 보안 검증 중 오류가 발생했습니다.',
        risk: 'high',
      };
    }
  }

  /**
   * 기본적인 파일 보안 검증
   */
  private async validateBasicFileSecurity(
    filePath: string,
    originalName: string,
  ): Promise<FileValidationResult> {
    try {
      // 파일 존재 확인
      const stats = await fs.stat(filePath);

      // 파일 크기 검증
      if (stats.size > this.maxFileSize) {
        return {
          isValid: false,
          reason: `파일 크기가 너무 큽니다. 최대 ${Math.round(this.maxFileSize / 1024 / 1024)}MB까지 허용됩니다.`,
          risk: 'medium',
        };
      }

      if (stats.size === 0) {
        return {
          isValid: false,
          reason: '빈 파일은 업로드할 수 없습니다.',
          risk: 'low',
        };
      }

      // 파일 확장자 검증
      const ext = path.extname(originalName).toLowerCase();
      if (this.blockedExtensions.includes(ext)) {
        return {
          isValid: false,
          reason: `${ext} 확장자는 보안상 허용되지 않습니다.`,
          risk: 'high',
        };
      }

      // 파일 이름 검증 (경로 탐색 공격 방지)
      if (
        originalName.includes('..') ||
        originalName.includes('/') ||
        originalName.includes('\\')
      ) {
        return {
          isValid: false,
          reason: '파일 이름에 허용되지 않는 문자가 포함되어 있습니다.',
          risk: 'high',
        };
      }

      return { isValid: true, risk: 'low' };
    } catch (error) {
      return {
        isValid: false,
        reason: '파일 정보를 읽을 수 없습니다.',
        risk: 'medium',
      };
    }
  }

  /**
   * 파일 내용 검증 (MIME 타입, 매직 넘버 등)
   */
  private async validateFileContent(
    filePath: string,
  ): Promise<FileValidationResult> {
    try {
      // 파일의 첫 512바이트 읽기 (매직 넘버 확인용)
      const buffer = Buffer.alloc(512);
      const fileHandle = await fs.open(filePath, 'r');
      const { bytesRead } = await fileHandle.read(buffer, 0, 512, 0);
      await fileHandle.close();

      const header = buffer.subarray(0, bytesRead);

      // PDF 파일 검증
      if (header.subarray(0, 4).toString() === '%PDF') {
        return this.validatePdfFile(header);
      }

      // Office 문서 검증 (ZIP 기반)
      if (header.subarray(0, 2).toString('hex') === '504b') {
        return this.validateOfficeFile(header);
      }

      // 이미지 파일 검증
      if (this.isImageFile(header)) {
        return this.validateImageFile(header);
      }

      // 텍스트 파일 검증
      if (this.isTextFile(header)) {
        return this.validateTextFile(filePath);
      }

      return { isValid: true, risk: 'low' };
    } catch (error) {
      this.logger.error(`파일 내용 검증 실패: ${filePath}`, error);
      return {
        isValid: false,
        reason: '파일 내용을 분석할 수 없습니다.',
        risk: 'medium',
      };
    }
  }

  /**
   * 파일에서 위험한 시그니처 검색
   */
  private async scanFileForThreats(filePath: string): Promise<FileScanResult> {
    const startTime = Date.now();
    const threats: string[] = [];

    try {
      // 파일을 청크 단위로 읽어서 스캔 (메모리 효율성)
      const chunkSize = 64 * 1024; // 64KB
      const fileHandle = await fs.open(filePath, 'r');
      const stats = await fs.stat(filePath);

      let position = 0;
      while (position < stats.size) {
        const remainingBytes = Math.min(chunkSize, stats.size - position);
        const buffer = Buffer.alloc(remainingBytes);
        const { bytesRead } = await fileHandle.read(
          buffer,
          0,
          remainingBytes,
          position,
        );

        if (bytesRead === 0) break;

        // 시그니처 검사
        for (const [
          threatName,
          signatures,
        ] of this.malwareSignatures.entries()) {
          for (const signature of signatures) {
            if (buffer.includes(signature)) {
              threats.push(threatName);
              this.logger.warn(
                `위험한 시그니처 발견: ${threatName} in ${filePath}`,
              );
            }
          }
        }

        position += bytesRead;
      }

      await fileHandle.close();

      const scanTime = Date.now() - startTime;

      return {
        isClean: threats.length === 0,
        threats: threats.length > 0 ? threats : undefined,
        scanEngine: 'internal-signature',
        scanTime,
      };
    } catch (error) {
      this.logger.error(`파일 스캔 실패: ${filePath}`, error);
      return {
        isClean: false,
        threats: ['SCAN_ERROR'],
        scanTime: Date.now() - startTime,
      };
    }
  }

  /**
   * PDF 파일 유효성 검증
   */
  private validatePdfFile(header: Buffer): FileValidationResult {
    // PDF 버전 확인
    const pdfVersion = header.subarray(5, 8).toString();
    const validVersions = [
      '1.0',
      '1.1',
      '1.2',
      '1.3',
      '1.4',
      '1.5',
      '1.6',
      '1.7',
      '2.0',
    ];

    if (!validVersions.includes(pdfVersion)) {
      return {
        isValid: false,
        reason: '지원되지 않는 PDF 버전입니다.',
        risk: 'medium',
      };
    }

    // JavaScript 포함 여부 검사
    if (
      header.includes(Buffer.from('/JavaScript', 'utf8')) ||
      header.includes(Buffer.from('/JS', 'utf8'))
    ) {
      return {
        isValid: false,
        reason: 'JavaScript가 포함된 PDF는 보안상 허용되지 않습니다.',
        risk: 'high',
      };
    }

    return { isValid: true, risk: 'low' };
  }

  /**
   * Office 문서 유효성 검증
   */
  private validateOfficeFile(header: Buffer): FileValidationResult {
    // ZIP 파일이지만 Office 문서인지 확인
    // 실제로는 ZIP 내부의 구조를 확인해야 하지만, 여기서는 기본적인 검증만

    return { isValid: true, risk: 'low' };
  }

  /**
   * 이미지 파일 유효성 검증
   */
  private validateImageFile(header: Buffer): FileValidationResult {
    // 기본적인 이미지 헤더 확인
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const gifHeader = Buffer.from([0x47, 0x49, 0x46]);

    const hasValidHeader =
      header.subarray(0, 3).equals(jpegHeader) ||
      header.subarray(0, 4).equals(pngHeader) ||
      header.subarray(0, 3).equals(gifHeader);

    if (!hasValidHeader) {
      return {
        isValid: false,
        reason: '올바르지 않은 이미지 파일 형식입니다.',
        risk: 'medium',
      };
    }

    return { isValid: true, risk: 'low' };
  }

  /**
   * 텍스트 파일 유효성 검증
   */
  private async validateTextFile(
    filePath: string,
  ): Promise<FileValidationResult> {
    try {
      // 첫 1KB만 읽어서 검증
      const buffer = Buffer.alloc(1024);
      const fileHandle = await fs.open(filePath, 'r');
      const { bytesRead } = await fileHandle.read(buffer, 0, 1024, 0);
      await fileHandle.close();

      const content = buffer.subarray(0, bytesRead).toString('utf8');

      // 스크립트 태그나 위험한 코드 패턴 검사
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /eval\(/i,
        /exec\(/i,
        /system\(/i,
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(content)) {
          return {
            isValid: false,
            reason: '텍스트 파일에 실행 가능한 코드가 포함되어 있습니다.',
            risk: 'high',
          };
        }
      }

      return { isValid: true, risk: 'low' };
    } catch (error) {
      return {
        isValid: false,
        reason: '텍스트 파일을 검증할 수 없습니다.',
        risk: 'medium',
      };
    }
  }

  /**
   * 이미지 파일 여부 확인
   */
  private isImageFile(header: Buffer): boolean {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const gifHeader = Buffer.from([0x47, 0x49, 0x46]);

    return (
      header.subarray(0, 3).equals(jpegHeader) ||
      header.subarray(0, 4).equals(pngHeader) ||
      header.subarray(0, 3).equals(gifHeader)
    );
  }

  /**
   * 텍스트 파일 여부 확인 (UTF-8 검증)
   */
  private isTextFile(header: Buffer): boolean {
    try {
      // UTF-8로 디코딩 시도
      const text = header.toString('utf8');

      // 제어 문자가 너무 많으면 바이너리 파일로 간주
      const controlChars = text.match(/[\x00-\x08\x0E-\x1F\x7F]/g);
      const controlCharRatio = controlChars
        ? controlChars.length / text.length
        : 0;

      return controlCharRatio < 0.1; // 10% 미만의 제어 문자
    } catch {
      return false;
    }
  }

  /**
   * 파일의 해시값을 계산합니다 (중복 검사용)
   */
  async calculateFileHash(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      this.logger.error(`파일 해시 계산 실패: ${filePath}`, error);
      throw new Error('파일 해시를 계산할 수 없습니다.');
    }
  }

  /**
   * 파일을 격리 영역으로 이동합니다
   */
  async quarantineFile(filePath: string, reason: string): Promise<string> {
    try {
      const quarantineDir = path.join(process.cwd(), 'quarantine');
      await fs.mkdir(quarantineDir, { recursive: true });

      const fileName = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const quarantinePath = path.join(
        quarantineDir,
        `${timestamp}_${fileName}`,
      );

      await fs.rename(filePath, quarantinePath);

      // 격리 로그 작성
      const logEntry = {
        originalPath: filePath,
        quarantinePath,
        reason,
        timestamp: new Date().toISOString(),
      };

      const logPath = path.join(quarantineDir, 'quarantine.log');
      await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');

      this.logger.warn(
        `파일이 격리되었습니다: ${filePath} -> ${quarantinePath} (사유: ${reason})`,
      );

      return quarantinePath;
    } catch (error) {
      this.logger.error(`파일 격리 실패: ${filePath}`, error);
      throw new Error('파일을 격리할 수 없습니다.');
    }
  }
}
