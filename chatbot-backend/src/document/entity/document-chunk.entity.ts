import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Document } from './document.entity';

@Entity()
export class DocumentChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Document, (document) => document.chunks, {
    onDelete: 'CASCADE',
  })
  document: Document;

  @Column()
  documentId: string;

  @Column({ type: 'text' })
  content: string; // 청크 텍스트 내용

  // PostgreSQL pgvector 확장 사용 (현재는 JSON으로 저장, 추후 마이그레이션)
  @Column({ type: 'json', nullable: true })
  embedding: number[]; // 임베딩 벡터 (1536차원 - OpenAI text-embedding-3-small)

  @Column({ type: 'int' })
  chunkIndex: number; // 문서 내 청크 순서

  @Column({ type: 'int', default: 0 })
  tokenCount: number; // 토큰 수

  @Column({ type: 'json', default: '{}' })
  metadata: {
    startPosition?: number;
    endPosition?: number;
    pageNumber?: number;
    section?: string;
    headings?: string[];
  };

  @Column({ type: 'float', default: 0.0 })
  relevanceScore: number; // 검색 시 계산되는 관련성 점수

  @Index()
  @Column({ type: 'tsvector', nullable: true })
  searchVector: string; // PostgreSQL 전문 검색을 위한 벡터
}
