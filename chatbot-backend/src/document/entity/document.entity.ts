import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Organization } from '../../auth/entity/organization.entity';
import { User } from '../../auth/entity/user.entity';
import { DocumentChunk } from './document-chunk.entity';

export enum DocumentType {
  POLICY = 'policy', // 정책/규정
  MANUAL = 'manual', // 매뉴얼
  FAQ = 'faq', // FAQ
  PROCEDURE = 'procedure', // 절차서
  REGULATION = 'regulation', // 관리규약
  CONTRACT = 'contract', // 계약서
  REPORT = 'report', // 보고서
  OTHER = 'other',
}

export enum DocumentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @Column()
  originalFileName: string;

  @Column()
  filePath: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ type: 'text' })
  extractedText: string; // 추출된 텍스트 내용

  @Column({ type: 'json', default: '{}' })
  metadata: {
    author?: string;
    version?: string;
    tags?: string[];
    language?: string;
    lastModified?: Date;
    pageCount?: number;
    processingStatus?: string;
    errorMessage?: string;
  };

  @ManyToOne(() => Organization, { nullable: true })
  organization?: Organization;

  @Column({ nullable: true })
  organizationId?: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;

  @OneToMany(() => DocumentChunk, (chunk) => chunk.document, {
    cascade: true,
  })
  chunks: DocumentChunk[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
