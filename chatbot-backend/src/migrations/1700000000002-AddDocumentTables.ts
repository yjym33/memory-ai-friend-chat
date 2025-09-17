import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentTables1700000000002 implements MigrationInterface {
  name = 'AddDocumentTables1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Document 테이블용 enum 생성
    await queryRunner.query(`
      CREATE TYPE "public"."document_type_enum" AS ENUM(
        'policy', 'manual', 'faq', 'procedure', 'regulation', 'contract', 'report', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."document_status_enum" AS ENUM(
        'draft', 'active', 'archived', 'deleted'
      )
    `);

    // Document 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "document" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text,
        "type" "public"."document_type_enum" NOT NULL DEFAULT 'other',
        "status" "public"."document_status_enum" NOT NULL DEFAULT 'draft',
        "originalFileName" character varying NOT NULL,
        "filePath" character varying NOT NULL,
        "fileSize" integer NOT NULL,
        "mimeType" character varying NOT NULL,
        "extractedText" text NOT NULL,
        "metadata" json NOT NULL DEFAULT '{}',
        "organizationId" uuid,
        "uploadedById" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_id" PRIMARY KEY ("id")
      )
    `);

    // pgvector 확장 설치
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS vector`);

    // DocumentChunk 테이블 생성 (pgvector 사용)
    await queryRunner.query(`
      CREATE TABLE "document_chunk" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "documentId" uuid NOT NULL,
        "content" text NOT NULL,
        "embedding" json,
        "chunkIndex" integer NOT NULL,
        "tokenCount" integer NOT NULL DEFAULT 0,
        "metadata" json NOT NULL DEFAULT '{}',
        "relevanceScore" real NOT NULL DEFAULT 0,
        "searchVector" tsvector,
        CONSTRAINT "PK_document_chunk_id" PRIMARY KEY ("id")
      )
    `);

    // 인덱스 생성
    await queryRunner.query(`
      CREATE INDEX "IDX_document_organization" ON "document" ("organizationId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_document_type" ON "document" ("type")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_document_status" ON "document" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_document_chunk_document" ON "document_chunk" ("documentId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_document_chunk_search_vector" ON "document_chunk" USING gin ("searchVector")
    `);

    // pgvector 인덱스 생성 (HNSW 알고리즘 사용 - 빠른 근사 검색)
    await queryRunner.query(`
      CREATE INDEX "IDX_document_chunk_embedding_cosine" 
      ON "document_chunk" 
      USING hnsw (embedding vector_cosine_ops)
    `);

    // IVFFlat 인덱스도 추가 (정확한 검색)
    await queryRunner.query(`
      CREATE INDEX "IDX_document_chunk_embedding_ivfflat" 
      ON "document_chunk" 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `);

    // Foreign key 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "document" 
      ADD CONSTRAINT "FK_document_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organization"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "document" 
      ADD CONSTRAINT "FK_document_uploaded_by" 
      FOREIGN KEY ("uploadedById") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "document_chunk" 
      ADD CONSTRAINT "FK_document_chunk_document" 
      FOREIGN KEY ("documentId") 
      REFERENCES "document"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign key 제약조건 제거
    await queryRunner.query(`
      ALTER TABLE "document_chunk" DROP CONSTRAINT "FK_document_chunk_document"
    `);

    await queryRunner.query(`
      ALTER TABLE "document" DROP CONSTRAINT "FK_document_uploaded_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "document" DROP CONSTRAINT "FK_document_organization"
    `);

    // 인덱스 제거
    await queryRunner.query(
      `DROP INDEX "IDX_document_chunk_embedding_ivfflat"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_document_chunk_embedding_cosine"`);
    await queryRunner.query(`DROP INDEX "IDX_document_chunk_search_vector"`);
    await queryRunner.query(`DROP INDEX "IDX_document_chunk_document"`);
    await queryRunner.query(`DROP INDEX "IDX_document_status"`);
    await queryRunner.query(`DROP INDEX "IDX_document_type"`);
    await queryRunner.query(`DROP INDEX "IDX_document_organization"`);

    // 테이블 제거
    await queryRunner.query(`DROP TABLE "document_chunk"`);
    await queryRunner.query(`DROP TABLE "document"`);

    // Enum 타입 제거
    await queryRunner.query(`DROP TYPE "public"."document_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."document_type_enum"`);
  }
}
