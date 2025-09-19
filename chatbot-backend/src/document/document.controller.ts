import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/types/request.types';
import {
  CreateDocumentDto,
  SearchDocumentsDto,
} from './dto/create-document.dto';
import { AdvancedSearchDto } from './dto/advanced-search.dto';
import { DocumentType, DocumentStatus } from './entity/document.entity';
import { UserType } from '../auth/entity/user.entity';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  /**
   * 문서를 업로드합니다.
   */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB 제한
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/plain',
        ];

        console.log(`📋 파일 필터 검사: ${file.originalname} (${file.mimetype})`);

        if (allowedMimes.includes(file.mimetype)) {
          console.log(`✅ 파일 타입 허용됨`);
          cb(null, true);
        } else {
          console.log(`❌ 파일 타입 거부됨: ${file.mimetype}`);
          cb(new BadRequestException(`지원하지 않는 파일 형식입니다: ${file.mimetype}. 지원 형식: PDF, DOC, DOCX, XLS, XLSX, TXT`), false);
        }
      },
    }),
  )
  async uploadDocument(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    console.log(`📤 문서 업로드 요청:`, {
      user: req.user.id,
      role: req.user.role,
      userType: req.user.userType,
      organizationId: req.user.organizationId,
      file: file ? {
        name: file.originalname,
        size: file.size,
        type: file.mimetype
      } : null,
      dto: createDocumentDto
    });

    try {
      if (!file) {
        throw new BadRequestException('파일이 업로드되지 않았습니다.');
      }

      // 관리자 또는 기업 사용자만 문서 업로드 가능
      const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(req.user.role);
      const isBusiness = req.user.userType === UserType.BUSINESS && req.user.organizationId;
      
      console.log(`🔐 권한 확인: isAdmin=${isAdmin}, isBusiness=${isBusiness}`);
      
      if (!isAdmin && !isBusiness) {
        throw new BadRequestException(
          '관리자 또는 기업 사용자만 문서를 업로드할 수 있습니다.',
        );
      }

      // 관리자의 경우 기본 조직 ID 사용 또는 첫 번째 조직 할당
      let targetOrganizationId = req.user.organizationId;
      
      if (isAdmin && !targetOrganizationId) {
        // 관리자가 조직이 없는 경우, 관리자용 기본 조직 생성 또는 사용
        // 임시로 'admin-default' 조직 ID 사용 (실제로는 DB에서 조회하거나 생성해야 함)
        targetOrganizationId = 'admin-default';
        console.log(`🏢 관리자 기본 조직 사용: ${targetOrganizationId}`);
      }

      console.log(`🎯 대상 조직: ${targetOrganizationId}`);

      const result = await this.documentService.uploadDocument(
        targetOrganizationId,
        req.user.userId || req.user.id,
        file,
        createDocumentDto,
      );

      console.log(`✅ 문서 업로드 완료: ${result.id}`);
      return result;

    } catch (error) {
      console.error(`❌ 문서 업로드 오류:`, {
        user: req.user.id,
        file: file?.originalname,
        error: error.message,
        stack: error.stack
      });

      // 에러를 다시 던져서 글로벌 에러 핸들러가 처리하도록 함
      throw error;
    }
  }

  /**
   * 문서를 검색합니다.
   */
  @Post('search')
  async searchDocuments(
    @Request() req: AuthenticatedRequest,
    @Body() searchDto: SearchDocumentsDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 문서를 검색할 수 있습니다.',
      );
    }

    return this.documentService.searchDocuments(
      req.user.organizationId,
      searchDto.query,
      {
        documentTypes: searchDto.types,
        limit: searchDto.limit || 10,
        threshold: searchDto.threshold || 0.7,
      },
    );
  }

  /**
   * 조직의 문서 목록을 조회합니다.
   */
  @Get()
  async getDocuments(
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 문서를 조회할 수 있습니다.',
      );
    }

    const pageNumber = page || 1;
    const limitNumber = limit || 20;
    const offsetNumber = offset || (pageNumber - 1) * limitNumber;

    const documents = await this.documentService.getOrganizationDocuments(
      req.user.organizationId,
      {
        type,
        status,
        limit: limitNumber,
        offset: offsetNumber,
      },
    );

    // 전체 문서 수 조회 (페이지네이션용)
    const totalCount = await this.documentService.getOrganizationDocumentsCount(
      req.user.organizationId,
      { type, status },
    );

    return {
      documents,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNumber),
      },
    };
  }

  /**
   * 문서를 삭제합니다.
   */
  @Delete(':id')
  async deleteDocument(
    @Request() req: AuthenticatedRequest,
    @Param('id') documentId: string,
  ) {
    return this.documentService.deleteDocument(
      documentId,
      req.user.userId || req.user.id,
    );
  }

  /**
   * 문서 타입 목록을 조회합니다.
   */
  @Get('types')
  async getDocumentTypes() {
    return Object.values(DocumentType).map((type) => ({
      value: type,
      label: this.getDocumentTypeLabel(type),
    }));
  }

  /**
   * 고급 검색을 수행합니다.
   */
  @Post('advanced-search')
  async advancedSearch(
    @Request() req: AuthenticatedRequest,
    @Body() searchDto: AdvancedSearchDto,
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 고급 검색을 사용할 수 있습니다.',
      );
    }

    return this.documentService.advancedSearch(
      req.user.organizationId,
      searchDto,
    );
  }

  /**
   * 검색 제안을 조회합니다.
   */
  @Get('suggestions')
  async getSearchSuggestions(
    @Request() req: AuthenticatedRequest,
    @Query('q') partialQuery: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (!req.user.organizationId) {
      return [];
    }

    return this.documentService.getSearchSuggestions(
      req.user.organizationId,
      partialQuery,
      limit,
    );
  }

  /**
   * 임베딩 상태를 조회합니다.
   */
  @Get('embedding-status')
  async getEmbeddingStatus(@Request() req: AuthenticatedRequest) {
    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 임베딩 상태를 조회할 수 있습니다.',
      );
    }

    return this.documentService.getEmbeddingStatus(req.user.organizationId);
  }

  /**
   * 누락된 임베딩을 재처리합니다. (관리자 전용)
   */
  @Post('reprocess-embeddings')
  async reprocessEmbeddings(@Request() req: AuthenticatedRequest) {
    // 관리자 또는 조직 관리자만 실행 가능
    if (!['super_admin', 'admin', 'org_admin'].includes(req.user.role)) {
      throw new BadRequestException(
        '관리자만 임베딩 재처리를 실행할 수 있습니다.',
      );
    }

    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 임베딩 재처리를 실행할 수 있습니다.',
      );
    }

    await this.documentService.reprocessMissingEmbeddings(
      req.user.organizationId,
    );

    return { message: '임베딩 재처리가 시작되었습니다.' };
  }

  private getDocumentTypeLabel(type: DocumentType): string {
    const labels = {
      [DocumentType.POLICY]: '정책/규정',
      [DocumentType.MANUAL]: '매뉴얼',
      [DocumentType.FAQ]: 'FAQ',
      [DocumentType.PROCEDURE]: '절차서',
      [DocumentType.REGULATION]: '관리규약',
      [DocumentType.CONTRACT]: '계약서',
      [DocumentType.REPORT]: '보고서',
      [DocumentType.OTHER]: '기타',
    };
    return labels[type] || type;
  }
}
