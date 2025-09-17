import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '../entity/document.entity';

export class AdvancedSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  documentTypes?: DocumentType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Transform(({ value }) => parseFloat(value))
  threshold?: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;

  @IsOptional()
  @IsEnum(['relevance', 'date', 'title', 'type'])
  sortBy?: 'relevance' | 'date' | 'title' | 'type' = 'relevance';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeDocuments?: string[]; // 제외할 문서 ID 목록

  @IsOptional()
  @IsString()
  searchScope?: 'title' | 'content' | 'both' = 'both';

  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(2000)
  @Transform(({ value }) => parseInt(value, 10))
  minChunkLength?: number = 100;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  @Transform(({ value }) => parseInt(value, 10))
  maxResultsPerDocument?: number = 3;
}
