import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

/**
 * 파일 내용 추출 서비스
 * 다양한 파일 형식에서 텍스트를 추출합니다.
 */
@Injectable()
export class FileExtractionService {
  private readonly logger = new Logger(FileExtractionService.name);

  /**
   * 파일 확장자별 추출 전략 매핑
   */
  private readonly extractionStrategies: Record<
    string,
    (filePath: string) => Promise<string>
  > = {
    '.pdf': this.extractPdf.bind(this),
    '.docx': this.extractDocx.bind(this),
    '.doc': this.extractDocx.bind(this),
    '.xlsx': this.extractXlsx.bind(this),
    '.xls': this.extractXlsx.bind(this),
    '.txt': this.extractText.bind(this),
  };

  /**
   * 파일에서 텍스트 추출 (메인 메서드)
   * @param filePath - 파일 경로
   * @returns 추출된 텍스트
   */
  async extractContent(filePath: string): Promise<string> {
    const extension = path.extname(filePath).toLowerCase();
    const strategy = this.extractionStrategies[extension];

    if (!strategy) {
      this.logger.warn(`Unsupported file type: ${extension}`);
      return '[지원하지 않는 파일 형식입니다.]';
    }

    try {
      return await strategy(filePath);
    } catch (error) {
      this.logger.error(`파일 추출 실패: ${filePath}`, error);
      throw new Error('파일 내용을 읽을 수 없습니다.');
    }
  }

  /**
   * PDF 파일 추출
   */
  private async extractPdf(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return data.text;
  }

  /**
   * DOCX 파일 추출
   */
  private async extractDocx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * XLSX 파일 추출
   */
  private async extractXlsx(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    let content = '';
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      content += `\n[${sheetName}]\n`;
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      content += JSON.stringify(jsonData, null, 2);
    });
    
    return content;
  }

  /**
   * 텍스트 파일 추출
   */
  private async extractText(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf8');
  }

  /**
   * 파일 내용에서 핵심 정보 추출
   * @param content - 전체 파일 내용
   * @param filename - 파일명
   * @param maxLength - 최대 길이 (기본값: 3000자)
   * @returns 핵심 내용 요약
   */
  extractKeyContent(
    content: string,
    filename: string,
    maxLength: number = 3000,
  ): string {
    const extension = filename.toLowerCase().split('.').pop();

    try {
      switch (extension) {
        case 'pdf':
          return this.extractPdfKeyContent(content, maxLength);
        case 'docx':
        case 'doc':
          return this.extractDocKeyContent(content, maxLength);
        case 'xlsx':
        case 'xls':
          return this.extractExcelKeyContent(content, maxLength);
        case 'txt':
          return this.extractTextKeyContent(content, maxLength);
        default:
          return this.truncateContent(content, maxLength);
      }
    } catch (error) {
      this.logger.error('핵심 내용 추출 중 오류:', error);
      return this.truncateContent(content, maxLength);
    }
  }

  /**
   * PDF 핵심 내용 추출
   */
  private extractPdfKeyContent(content: string, maxLength: number): string {
    // 제목, 헤더, 중요 키워드가 포함된 문단 우선 추출
    const lines = content.split('\n').filter((line) => line.trim().length > 0);
    
    const importantLines = lines.filter(
      (line) =>
        line.length < 100 && // 짧은 줄 (제목일 가능성)
        (line.match(/^[A-Z]/) || // 대문자로 시작
          line.includes(':') || // 콜론 포함
          line.match(/^\d+\./)), // 번호 매기기
    );

    const keyContent = importantLines.slice(0, 20).join('\n');
    return this.truncateContent(
      keyContent || content,
      maxLength,
    );
  }

  /**
   * DOC/DOCX 핵심 내용 추출
   */
  private extractDocKeyContent(content: string, maxLength: number): string {
    // 문서의 첫 부분과 헤딩 추출
    const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);
    const keyParagraphs = paragraphs.slice(0, 10);
    
    return this.truncateContent(keyParagraphs.join('\n\n'), maxLength);
  }

  /**
   * Excel 핵심 내용 추출
   */
  private extractExcelKeyContent(content: string, maxLength: number): string {
    try {
      const parsed = JSON.parse(content);
      // 첫 10행만 추출
      const preview = Array.isArray(parsed) ? parsed.slice(0, 10) : parsed;
      return this.truncateContent(JSON.stringify(preview, null, 2), maxLength);
    } catch {
      return this.truncateContent(content, maxLength);
    }
  }

  /**
   * 텍스트 핵심 내용 추출
   */
  private extractTextKeyContent(content: string, maxLength: number): string {
    // 첫 부분만 추출
    return this.truncateContent(content, maxLength);
  }

  /**
   * 내용을 지정된 길이로 자르기
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '\n... (생략됨)';
  }
}

