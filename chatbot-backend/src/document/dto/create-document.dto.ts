import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { DocumentType } from '../entity/document.entity';

export class CreateDocumentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DocumentType)
  type: DocumentType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class SearchDocumentsDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  types?: DocumentType[];

  @IsOptional()
  limit?: number;

  @IsOptional()
  threshold?: number;
}
