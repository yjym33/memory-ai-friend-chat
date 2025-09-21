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
          'application/octet-stream', // 일부 브라우저에서 파일 타입을 올바르게 감지하지 못할 때
        ];

        // 파일 확장자 기반 검증도 추가
        const allowedExtensions = [
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.txt',
        ];
        const fileExtension = file.originalname
          .toLowerCase()
          .match(/\.[^.]+$/)?.[0];

        console.log(`📋 파일 필터 검사: ${file.originalname}`);
        console.log(`   - MIME 타입: ${file.mimetype}`);
        console.log(`   - 확장자: ${fileExtension}`);

        const isMimeAllowed = allowedMimes.includes(file.mimetype);
        const isExtensionAllowed =
          fileExtension && allowedExtensions.includes(fileExtension);

        if (isMimeAllowed || isExtensionAllowed) {
          console.log(
            `✅ 파일 타입 허용됨 (MIME: ${isMimeAllowed}, 확장자: ${isExtensionAllowed})`,
          );
          cb(null, true);
        } else {
          console.log(
            `❌ 파일 타입 거부됨: MIME=${file.mimetype}, 확장자=${fileExtension}`,
          );
          cb(
            new BadRequestException(
              `지원하지 않는 파일 형식입니다. 지원 형식: PDF, DOC, DOCX, XLS, XLSX, TXT`,
            ),
            false,
          );
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
      file: file
        ? {
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
          }
        : null,
      dto: createDocumentDto,
    });

    try {
      if (!file) {
        throw new BadRequestException('파일이 업로드되지 않았습니다.');
      }

      // 기업 사용자 또는 관리자만 문서 업로드 가능
      const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(
        req.user.role,
      );
      const isBusiness = req.user.userType === UserType.BUSINESS;

      console.log(
        `🔐 권한 확인: isAdmin=${isAdmin}, isBusiness=${isBusiness}, organizationId=${req.user.organizationId}`,
      );

      if (!isAdmin && !isBusiness) {
        throw new BadRequestException(
          '기업 사용자 또는 관리자만 문서를 업로드할 수 있습니다.',
        );
      }

      // 조직 ID 결정
      let targetOrganizationId = req.user.organizationId;

      if (!targetOrganizationId) {
        if (isAdmin) {
          // 관리자가 조직이 없는 경우, 관리자 조직 사용
          targetOrganizationId = '2eb0ef7b-ddab-40a7-82bd-b75d07520e7a'; // Admin Organization ID
          console.log(`🏢 관리자 기본 조직 사용: ${targetOrganizationId}`);
        } else {
          throw new BadRequestException(
            '기업 사용자는 조직에 속해야 문서를 업로드할 수 있습니다.',
          );
        }
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
        stack: error.stack,
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
    // 기업 사용자 또는 관리자만 문서 검색 가능
    const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(
      req.user.role,
    );
    const isBusiness = req.user.userType === UserType.BUSINESS;

    if (!isAdmin && !isBusiness) {
      throw new BadRequestException(
        '기업 사용자 또는 관리자만 문서를 검색할 수 있습니다.',
      );
    }

    let targetOrganizationId = req.user.organizationId;

    if (!targetOrganizationId) {
      if (isAdmin) {
        targetOrganizationId = '2eb0ef7b-ddab-40a7-82bd-b75d07520e7a'; // Admin Organization ID
      } else {
        throw new BadRequestException(
          '기업 사용자는 조직에 속해야 문서를 검색할 수 있습니다.',
        );
      }
    }

    return this.documentService.searchDocuments(
      targetOrganizationId,
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
    // 기업 사용자 또는 관리자만 문서 조회 가능
    const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(
      req.user.role,
    );
    const isBusiness = req.user.userType === UserType.BUSINESS;

    if (!isAdmin && !isBusiness) {
      throw new BadRequestException(
        '기업 사용자 또는 관리자만 문서를 조회할 수 있습니다.',
      );
    }

    let targetOrganizationId = req.user.organizationId;

    if (!targetOrganizationId) {
      if (isAdmin) {
        targetOrganizationId = '2eb0ef7b-ddab-40a7-82bd-b75d07520e7a'; // Admin Organization ID
      } else {
        throw new BadRequestException(
          '기업 사용자는 조직에 속해야 문서를 조회할 수 있습니다.',
        );
      }
    }

    const pageNumber = page || 1;
    const limitNumber = limit || 20;
    const offsetNumber = offset || (pageNumber - 1) * limitNumber;

    const documents = await this.documentService.getOrganizationDocuments(
      targetOrganizationId,
      {
        type,
        status,
        limit: limitNumber,
        offset: offsetNumber,
      },
    );

    // 전체 문서 수 조회 (페이지네이션용)
    const totalCount = await this.documentService.getOrganizationDocumentsCount(
      targetOrganizationId,
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
   * 임베딩 상태를 조회합니다.
   */
  @Get('embedding-status')
  async getEmbeddingStatus(@Request() req: AuthenticatedRequest) {
    // 기업 사용자 또는 관리자만 임베딩 상태 조회 가능
    const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(
      req.user.role,
    );
    const isBusiness = req.user.userType === UserType.BUSINESS;

    if (!isAdmin && !isBusiness) {
      throw new BadRequestException(
        '기업 사용자 또는 관리자만 임베딩 상태를 조회할 수 있습니다.',
      );
    }

    let targetOrganizationId = req.user.organizationId;

    if (!targetOrganizationId) {
      if (isAdmin) {
        targetOrganizationId = '2eb0ef7b-ddab-40a7-82bd-b75d07520e7a'; // Admin Organization ID
      } else {
        throw new BadRequestException(
          '기업 사용자는 조직에 속해야 임베딩 상태를 조회할 수 있습니다.',
        );
      }
    }

    return this.documentService.getEmbeddingStatus(targetOrganizationId);
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
   * 누락된 임베딩을 재처리합니다.
   */
  @Post('reprocess-embeddings')
  async reprocessEmbeddings(@Request() req: AuthenticatedRequest) {
    // 기업 사용자 또는 관리자만 실행 가능
    const isAdmin = ['super_admin', 'admin', 'org_admin'].includes(
      req.user.role,
    );
    const isBusiness = req.user.userType === UserType.BUSINESS;

    if (!isAdmin && !isBusiness) {
      throw new BadRequestException(
        '기업 사용자 또는 관리자만 임베딩 재처리를 실행할 수 있습니다.',
      );
    }

    let targetOrganizationId = req.user.organizationId;

    if (!targetOrganizationId) {
      if (isAdmin) {
        targetOrganizationId = '2eb0ef7b-ddab-40a7-82bd-b75d07520e7a'; // Admin Organization ID
      } else {
        throw new BadRequestException(
          '기업 사용자는 조직에 속해야 임베딩 재처리를 실행할 수 있습니다.',
        );
      }
    }

    await this.documentService.reprocessMissingEmbeddings(targetOrganizationId);

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
