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

        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('지원하지 않는 파일 형식입니다.'), false);
        }
      },
    }),
  )
  async uploadDocument(
    @Request() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 업로드되지 않았습니다.');
    }

    // 기업 사용자만 문서 업로드 가능
    if (req.user.userType !== UserType.BUSINESS || !req.user.organizationId) {
      throw new BadRequestException(
        '기업 사용자만 문서를 업로드할 수 있습니다.',
      );
    }

    return this.documentService.uploadDocument(
      req.user.organizationId,
      req.user.userId || req.user.id,
      file,
      createDocumentDto,
    );
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
  ) {
    if (!req.user.organizationId) {
      throw new BadRequestException(
        '조직에 속한 사용자만 문서를 조회할 수 있습니다.',
      );
    }

    return this.documentService.getOrganizationDocuments(
      req.user.organizationId,
      {
        type,
        status,
        limit,
        offset,
      },
    );
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
