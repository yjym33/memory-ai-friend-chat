import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Document } from './document.entity';
import { User } from '../../auth/entity/user.entity';

export enum VersionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
}

@Entity()
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, { onDelete: 'CASCADE' })
  document: Document;

  @Column()
  documentId: string;

  @Column({ type: 'int' })
  versionNumber: number; // 1, 2, 3, ...

  @Column()
  versionName: string; // v1.0, v1.1, etc.

  @Column({ type: 'text', nullable: true })
  changeLog: string; // 변경 내용

  @Column()
  filePath: string; // 이 버전의 파일 경로

  @Column()
  fileSize: number;

  @Column({ type: 'text' })
  extractedText: string;

  @Column({
    type: 'enum',
    enum: VersionStatus,
    default: VersionStatus.DRAFT,
  })
  status: VersionStatus;

  @Column({ type: 'json', default: '{}' })
  metadata: {
    author?: string;
    tags?: string[];
    pageCount?: number;
    processingTime?: number; // 처리 시간 (초)
  };

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;

  @CreateDateColumn()
  createdAt: Date;

  // 청크는 별도 테이블로 관리 (DocumentVersionChunk)
}
