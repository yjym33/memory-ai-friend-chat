import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLLMProviderAndApiKeys1700000000006
  implements MigrationInterface
{
  name = 'AddLLMProviderAndApiKeys1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // LLMProvider enum 생성
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "llm_provider_enum" AS ENUM('openai', 'google', 'anthropic');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // AiSettings에 LLM 관련 필드 추가
    await queryRunner.addColumn(
      'ai_settings',
      new TableColumn({
        name: 'llmProvider',
        type: 'enum',
        enum: ['openai', 'google', 'anthropic'],
        default: "'openai'",
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'ai_settings',
      new TableColumn({
        name: 'llmModel',
        type: 'varchar',
        default: "'gpt-5.1'",
        isNullable: false,
      }),
    );

    await queryRunner.addColumn(
      'ai_settings',
      new TableColumn({
        name: 'llmConfig',
        type: 'json',
        isNullable: true,
        default: 'NULL',
      }),
    );

    // User에 API 키 저장 필드 추가
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'llmApiKeys',
        type: 'json',
        isNullable: true,
        default: 'NULL',
      }),
    );

    // 인덱스 추가
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_ai_settings_llm_provider" 
      ON "ai_settings" ("llmProvider");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 삭제
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_ai_settings_llm_provider";
    `);

    // User 테이블에서 컬럼 삭제
    await queryRunner.dropColumn('user', 'llmApiKeys');

    // AiSettings 테이블에서 컬럼 삭제
    await queryRunner.dropColumn('ai_settings', 'llmConfig');
    await queryRunner.dropColumn('ai_settings', 'llmModel');
    await queryRunner.dropColumn('ai_settings', 'llmProvider');

    // enum 타입 삭제
    await queryRunner.query(`DROP TYPE IF EXISTS "llm_provider_enum";`);
  }
}

