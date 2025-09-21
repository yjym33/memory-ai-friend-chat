import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { promises as fs } from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import {
  Document,
  DocumentType,
  DocumentStatus,
} from './entity/document.entity';
import { DocumentChunk } from './entity/document-chunk.entity';
import { VectorService } from './vector.service';

interface DocumentMetadata {
  title: string;
  description?: string;
  type: DocumentType;
  tags?: string[];
}

interface SearchOptions {
  documentTypes?: DocumentType[];
  limit?: number;
  threshold?: number;
}

@Injectable()
export class DocumentService {
  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentChunk)
    private chunkRepository: Repository<DocumentChunk>,
    private vectorService: VectorService,
  ) {}

  /**
   * 문서를 업로드하고 처리합니다.
   */
  async uploadDocument(
    organizationId: string,
    uploadedById: string,
    file: Express.Multer.File,
    metadata: DocumentMetadata,
  ): Promise<Document> {
    console.log(`🚀 문서 업로드 시작: ${file.originalname}`);
    console.log(`📋 메타데이터:`, { organizationId, uploadedById, metadata });

    try {
      // 1. 입력 검증
      if (!file || !file.buffer) {
        throw new BadRequestException('유효하지 않은 파일입니다.');
      }

      if (!organizationId) {
        throw new BadRequestException('조직 ID가 필요합니다.');
      }

      if (!uploadedById) {
        throw new BadRequestException('업로드 사용자 ID가 필요합니다.');
      }

      console.log(`✅ 입력 검증 완료`);

      // 2. 파일 저장
      console.log(`💾 1/4: 파일 저장 중...`);
      const filePath = await this.saveFile(file);

      // 3. 텍스트 추출
      console.log(`📄 2/4: 텍스트 추출 중...`);
      const extractedText = await this.extractText(file);

      if (!extractedText.trim()) {
        throw new BadRequestException('파일에서 텍스트를 추출할 수 없습니다. 빈 파일이거나 지원하지 않는 형식입니다.');
      }

      console.log(`✅ 텍스트 추출 완료: ${extractedText.length} 문자`);

      // 4. 문서 메타데이터 준비
      console.log(`📝 3/4: 문서 정보 저장 중...`);
      const documentData = {
        ...metadata,
        originalFileName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        extractedText,
        organizationId,
        uploadedById,
        status: DocumentStatus.ACTIVE,
        metadata: {
          ...(metadata.tags && { tags: metadata.tags }),
          language: 'ko',
          lastModified: new Date(),
          processingStatus: 'pending',
          uploadTimestamp: new Date(),
        },
      };

      // 5. 문서 저장
      const document = await this.documentRepository.save(documentData);
      console.log(`✅ 문서 저장 완료: ID ${document.id}`);

      // 6. 백그라운드에서 텍스트 청킹 및 임베딩 처리
      console.log(`🔄 4/4: 백그라운드 임베딩 처리 시작...`);
      this.processDocumentForSearch(document).catch((error) => {
        console.error('❌ 문서 처리 실패:', error);
        // 실패 시 문서 상태를 draft로 변경
        this.documentRepository.update(document.id, {
          status: DocumentStatus.DRAFT,
          metadata: {
            ...document.metadata,
            processingStatus: 'failed',
            errorMessage: error.message,
          },
        });
      });

      console.log(`🎉 문서 업로드 완료: ${document.title} (ID: ${document.id})`);
      return document;

    } catch (error) {
      console.error('❌ 문서 업로드 실패:', {
        file: file?.originalname,
        organizationId,
        uploadedById,
        error: error.message,
        stack: error.stack
      });
      
      // 업로드 실패 시 임시 파일 정리 (filePath가 있는 경우)
      if (error.filePath) {
        try {
          await fs.unlink(error.filePath);
        } catch (cleanupError) {
          console.error('임시 파일 정리 실패:', cleanupError);
        }
      }

      throw error;
    }
  }

  /**
   * 문서를 검색합니다.
   */
  async searchDocuments(
    organizationId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<
    Array<{ document: Document; chunk: DocumentChunk; score: number }>
  > {
    const searchResults = await this.vectorService.searchSimilarChunks(
      organizationId,
      query,
      options,
    );

    return searchResults.map((result) => ({
      document: result.chunk.document,
      chunk: result.chunk,
      score: result.score,
    }));
  }

  /**
   * 조직의 문서 목록을 조회합니다.
   */
  async getOrganizationDocuments(
    organizationId: string,
    options: {
      type?: DocumentType;
      status?: DocumentStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<Document[]> {
    const {
      type,
      status = DocumentStatus.ACTIVE,
      limit = 50,
      offset = 0,
    } = options;

    let queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status })
      .orderBy('document.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (type) {
      queryBuilder = queryBuilder.andWhere('document.type = :type', { type });
    }

    return queryBuilder.getMany();
  }

  /**
   * 조직의 문서 총 개수를 조회합니다.
   */
  async getOrganizationDocumentsCount(
    organizationId: string,
    options: {
      type?: DocumentType;
      status?: DocumentStatus;
    } = {},
  ): Promise<number> {
    const { type, status = DocumentStatus.ACTIVE } = options;

    let queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status });

    if (type) {
      queryBuilder = queryBuilder.andWhere('document.type = :type', { type });
    }

    return queryBuilder.getCount();
  }

  /**
   * 임베딩 상태를 조회합니다.
   */
  async getEmbeddingStatus(organizationId: string) {
    const totalChunks = await this.chunkRepository.count({
      where: {
        document: {
          organizationId,
        },
      },
      relations: ['document'],
    });

    const embeddedChunks = await this.chunkRepository.count({
      where: {
        document: {
          organizationId,
        },
        embedding: Not(IsNull()),
      },
      relations: ['document'],
    });

    const pendingChunks = totalChunks - embeddedChunks;
    const embeddingProgress = totalChunks > 0 ? Math.round((embeddedChunks / totalChunks) * 100) : 100;

    return {
      totalChunks,
      embeddedChunks,
      pendingChunks,
      embeddingProgress,
    };
  }

  /**
   * 누락된 임베딩을 재처리합니다.
   */
  async reprocessMissingEmbeddings(organizationId: string) {
    const pendingChunks = await this.chunkRepository.find({
      where: {
        document: {
          organizationId,
        },
        embedding: IsNull(),
      },
      relations: ['document'],
      take: 100, // 한 번에 최대 100개씩 처리
    });

    console.log(`🔄 임베딩 재처리 시작: ${pendingChunks.length}개 청크`);

    for (const chunk of pendingChunks) {
      try {
        const embedding = await this.vectorService.generateEmbedding(chunk.content);
        chunk.embedding = embedding;
        await this.chunkRepository.save(chunk);
        console.log(`✅ 청크 임베딩 완료: ${chunk.id}`);
      } catch (error) {
        console.error(`❌ 청크 임베딩 실패: ${chunk.id}`, error);
      }
    }

    console.log(`🎉 임베딩 재처리 완료: ${pendingChunks.length}개 청크`);
    return { processedChunks: pendingChunks.length };
  }

  /**
   * 문서를 삭제합니다.
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('문서를 찾을 수 없습니다.');
    }

    // 업로드한 사용자만 삭제 가능 (추후 권한 체크 로직 추가)
    if (document.uploadedById !== userId) {
      throw new BadRequestException('문서를 삭제할 권한이 없습니다.');
    }

    // soft delete
    await this.documentRepository.update(documentId, {
      status: DocumentStatus.DELETED,
    });

    // 관련 청크들도 삭제
    await this.chunkRepository.delete({ documentId });

    // 실제 파일 삭제
    try {
      await fs.unlink(document.filePath);
    } catch (error) {
      console.error('파일 삭제 실패:', error);
    }
  }

  /**
   * 파일을 저장합니다.
   */
  private async saveFile(file: Express.Multer.File): Promise<string> {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    
    console.log(`💾 파일 저장 시작: ${file.originalname} (${file.size} bytes)`);
    console.log(`📁 업로드 디렉토리: ${uploadsDir}`);

    try {
      // 디렉토리 생성
      await fs.mkdir(uploadsDir, { recursive: true });
      console.log(`✅ 업로드 디렉토리 준비 완료`);

      // 안전한 파일명 생성 (특수문자 제거)
      const timestamp = Date.now();
      const randomId = Math.floor(Math.random() * 1000000);
      const safeFileName = file.originalname
        .replace(/[^a-zA-Z0-9가-힣._-]/g, '_')  // 특수문자를 언더스코어로 변경
        .replace(/_{2,}/g, '_')  // 연속된 언더스코어를 하나로 변경
        .slice(0, 100);  // 파일명 길이 제한
      
      const filename = `${timestamp}-${randomId}-${safeFileName}`;
      const filePath = path.join(uploadsDir, filename);
      
      console.log(`📝 저장할 파일명: ${filename}`);

      // 파일 저장
      await fs.writeFile(filePath, file.buffer);
      
      // 저장된 파일 검증
      const stats = await fs.stat(filePath);
      console.log(`✅ 파일 저장 완료: ${filePath} (${stats.size} bytes)`);
      
      if (stats.size !== file.buffer.length) {
        throw new Error(`파일 크기 불일치: 원본 ${file.buffer.length} bytes, 저장됨 ${stats.size} bytes`);
      }

      return filePath;
    } catch (error) {
      console.error('❌ 파일 저장 실패:', {
        originalname: file.originalname,
        size: file.size,
        uploadsDir,
        error: error.message,
        stack: error.stack
      });
      
      throw new BadRequestException(
        `파일 저장에 실패했습니다: ${error.message}`
      );
    }
  }

  /**
   * 파일에서 텍스트를 추출합니다.
   */
  private async extractText(file: Express.Multer.File): Promise<string> {
    const { mimetype, buffer, originalname } = file;
    
    console.log(`📄 텍스트 추출 시작: ${originalname} (${mimetype}, ${buffer.length} bytes)`);

    try {
      let extractedText = '';
      
      switch (mimetype) {
        case 'application/pdf':
          console.log('PDF 파일 처리 중...');
          try {
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text;
            console.log(`✅ PDF 텍스트 추출 완료: ${extractedText.length} 문자`);
          } catch (pdfError) {
            console.error('PDF 추출 실패:', pdfError);
            throw new Error(`PDF 파일을 처리할 수 없습니다: ${pdfError.message}`);
          }
          break;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          console.log('Word 문서 처리 중...');
          try {
            const docResult = await mammoth.extractRawText({ buffer });
            extractedText = docResult.value;
            console.log(`✅ Word 텍스트 추출 완료: ${extractedText.length} 문자`);
          } catch (docError) {
            console.error('Word 추출 실패:', docError);
            throw new Error(`Word 문서를 처리할 수 없습니다: ${docError.message}`);
          }
          break;

        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          console.log('Excel 파일 처리 중...');
          try {
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            let excelText = '';
            workbook.SheetNames.forEach((sheetName) => {
              const sheet = workbook.Sheets[sheetName];
              const sheetText = XLSX.utils.sheet_to_txt(sheet);
              excelText += `=== ${sheetName} ===\n${sheetText}\n\n`;
            });
            extractedText = excelText;
            console.log(`✅ Excel 텍스트 추출 완료: ${extractedText.length} 문자, ${workbook.SheetNames.length}개 시트`);
          } catch (excelError) {
            console.error('Excel 추출 실패:', excelError);
            throw new Error(`Excel 파일을 처리할 수 없습니다: ${excelError.message}`);
          }
          break;

        case 'text/plain':
          console.log('텍스트 파일 처리 중...');
          try {
            extractedText = buffer.toString('utf-8');
            console.log(`✅ 텍스트 파일 추출 완료: ${extractedText.length} 문자`);
          } catch (textError) {
            console.error('텍스트 추출 실패:', textError);
            // UTF-8로 실패하면 다른 인코딩 시도
            try {
              extractedText = buffer.toString('latin1');
              console.log(`✅ 텍스트 파일 추출 완료 (latin1): ${extractedText.length} 문자`);
            } catch (fallbackError) {
              throw new Error(`텍스트 파일을 처리할 수 없습니다: ${textError.message}`);
            }
          }
          break;

        default:
          throw new BadRequestException(
            `지원하지 않는 파일 형식입니다: ${mimetype}. 지원 형식: PDF, DOC, DOCX, XLS, XLSX, TXT`,
          );
      }

      // 텍스트 검증
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('파일에서 텍스트를 찾을 수 없습니다. 빈 파일이거나 텍스트 내용이 없는 파일입니다.');
      }

      // 최소 길이 검증 (너무 짧은 텍스트 방지)
      if (extractedText.trim().length < 10) {
        console.warn(`⚠️ 추출된 텍스트가 매우 짧습니다: "${extractedText.trim()}"`);
      }

      console.log(`🎉 텍스트 추출 완료: ${extractedText.length} 문자`);
      return extractedText;

    } catch (error) {
      console.error('❌ 텍스트 추출 실패:', {
        file: originalname,
        mimetype,
        bufferSize: buffer.length,
        error: error.message,
        stack: error.stack
      });
      
      throw new BadRequestException(
        `파일에서 텍스트를 추출할 수 없습니다: ${error.message}`
      );
    }
  }

  /**
   * 문서를 검색용으로 처리합니다 (청킹 및 임베딩).
   */
  private async processDocumentForSearch(document: Document): Promise<void> {
    try {
      // 1. 텍스트를 청크로 분할
      const chunks = await this.chunkText(document.extractedText);

      // 2. 각 청크를 데이터베이스에 저장하고 임베딩 생성
      const documentChunks: DocumentChunk[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = await this.chunkRepository.save({
          documentId: document.id,
          content: chunks[i],
          chunkIndex: i,
          tokenCount: this.estimateTokenCount(chunks[i]),
          metadata: {
            startPosition: i * 1000, // 대략적인 위치
            section: this.extractSection(chunks[i]),
          },
        });

        documentChunks.push(chunk);
      }

      // 3. 임베딩 생성 및 업데이트
      await this.vectorService.updateChunkEmbeddings(documentChunks);

      console.log(
        `✅ 문서 처리 완료: ${document.title} (${chunks.length}개 청크)`,
      );
    } catch (error) {
      console.error('문서 처리 실패:', error);
      throw error;
    }
  }

  /**
   * 텍스트를 청크로 분할합니다.
   */
  private async chunkText(
    text: string,
    chunkSize = 1000,
    overlap = 200,
  ): Promise<string[]> {
    const chunks: string[] = [];
    let startIndex = 0;

    // 문단 단위로 분할 시도
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= chunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // 긴 문단은 강제로 분할
        if (paragraph.length > chunkSize) {
          const subChunks = this.splitLongText(paragraph, chunkSize, overlap);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = paragraph;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((chunk) => chunk.length > 50); // 너무 짧은 청크 제외
  }

  /**
   * 긴 텍스트를 강제로 분할합니다.
   */
  private splitLongText(
    text: string,
    chunkSize: number,
    overlap: number,
  ): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length);
      const chunk = text.substring(startIndex, endIndex);
      chunks.push(chunk);
      startIndex += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * 토큰 수를 추정합니다.
   */
  private estimateTokenCount(text: string): number {
    // 한국어는 대략 1.5글자당 1토큰으로 추정
    return Math.ceil(text.length / 1.5);
  }

  /**
   * 텍스트에서 섹션을 추출합니다.
   */
  private extractSection(text: string): string {
    // 첫 줄이나 제목 형태를 섹션으로 추출
    const firstLine = text.split('\n')[0];
    if (firstLine.length < 100) {
      return firstLine.trim();
    }
    return '';
  }

  /**
   * 고급 검색을 수행합니다.
   */
  async advancedSearch(
    organizationId: string,
    searchParams: {
      query: string;
      documentTypes?: DocumentType[];
      tags?: string[];
      author?: string;
      dateFrom?: string;
      dateTo?: string;
      threshold?: number;
      limit?: number;
      offset?: number;
      sortBy?: 'relevance' | 'date' | 'title' | 'type';
      sortOrder?: 'asc' | 'desc';
      excludeDocuments?: string[];
      searchScope?: 'title' | 'content' | 'both';
      minChunkLength?: number;
      maxResultsPerDocument?: number;
    },
  ): Promise<{
    results: Array<{ document: Document; chunk: DocumentChunk; score: number }>;
    total: number;
    hasMore: boolean;
  }> {
    const {
      query,
      documentTypes,
      tags,
      author,
      dateFrom,
      dateTo,
      threshold = 0.7,
      limit = 10,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc',
      excludeDocuments = [],
      searchScope = 'both',
      minChunkLength = 100,
      maxResultsPerDocument = 3,
    } = searchParams;

    // 1. 기본 벡터 검색
    let searchResults = await this.vectorService.searchSimilarChunks(
      organizationId,
      query,
      {
        documentTypes,
        limit: limit * 3, // 필터링을 고려하여 더 많이 가져옴
        threshold,
      },
    );

    // 2. 추가 필터링
    const filteredResults = searchResults.filter((result) => {
      const { chunk } = result;
      const document = chunk.document;

      // 제외할 문서 필터링
      if (excludeDocuments.includes(document.id)) return false;

      // 최소 청크 길이 필터링
      if (chunk.content.length < minChunkLength) return false;

      // 작성자 필터링
      if (author && document.metadata.author !== author) return false;

      // 태그 필터링
      if (tags && tags.length > 0) {
        const docTags = document.metadata.tags || [];
        if (!tags.some((tag) => docTags.includes(tag))) return false;
      }

      // 날짜 범위 필터링
      if (dateFrom || dateTo) {
        const docDate = new Date(document.createdAt);
        if (dateFrom && docDate < new Date(dateFrom)) return false;
        if (dateTo && docDate > new Date(dateTo)) return false;
      }

      // 검색 범위 필터링
      if (searchScope === 'title') {
        return document.title.toLowerCase().includes(query.toLowerCase());
      } else if (searchScope === 'content') {
        return chunk.content.toLowerCase().includes(query.toLowerCase());
      }

      return true;
    });

    // 3. 문서당 최대 결과 수 제한
    const documentResultCounts = new Map<string, number>();
    const limitedResults = filteredResults.filter((result) => {
      const docId = result.chunk.document.id;
      const currentCount = documentResultCounts.get(docId) || 0;

      if (currentCount >= maxResultsPerDocument) {
        return false;
      }

      documentResultCounts.set(docId, currentCount + 1);
      return true;
    });

    // 4. 정렬
    if (sortBy !== 'relevance') {
      limitedResults.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'date':
            comparison =
              new Date(a.chunk.document.createdAt).getTime() -
              new Date(b.chunk.document.createdAt).getTime();
            break;
          case 'title':
            comparison = a.chunk.document.title.localeCompare(
              b.chunk.document.title,
            );
            break;
          case 'type':
            comparison = a.chunk.document.type.localeCompare(
              b.chunk.document.type,
            );
            break;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // 5. 페이지네이션
    const total = limitedResults.length;
    const paginatedResults = limitedResults.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      results: paginatedResults.map((result) => ({
        document: result.chunk.document,
        chunk: result.chunk,
        score: result.score,
      })),
      total,
      hasMore,
    };
  }

  /**
   * 검색 제안을 생성합니다.
   */
  async getSearchSuggestions(
    organizationId: string,
    partialQuery: string,
    limit = 5,
  ): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    // 문서 제목과 태그에서 제안 추출
    const documents = await this.documentRepository
      .createQueryBuilder('document')
      .where('document.organizationId = :organizationId', { organizationId })
      .andWhere('document.status = :status', { status: DocumentStatus.ACTIVE })
      .select(['document.title', 'document.metadata'])
      .getMany();

    const suggestions = new Set<string>();

    documents.forEach((doc) => {
      // 제목에서 제안 추출
      const titleWords = doc.title.toLowerCase().split(/\s+/);
      titleWords.forEach((word) => {
        if (word.includes(partialQuery.toLowerCase()) && word.length > 2) {
          suggestions.add(word);
        }
      });

      // 태그에서 제안 추출
      const tags = doc.metadata.tags || [];
      tags.forEach((tag) => {
        if (tag.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(tag);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

}
