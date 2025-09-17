import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatModeToAiSettings1700000000003
  implements MigrationInterface
{
  name = 'AddChatModeToAiSettings1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ChatMode enum 생성
    await queryRunner.query(`
      CREATE TYPE "public"."chat_mode_enum" AS ENUM('personal', 'business')
    `);

    // AiSettings 테이블에 새로운 컬럼들 추가
    await queryRunner.query(`
      ALTER TABLE "ai_settings" 
      ADD "chatMode" "public"."chat_mode_enum" NOT NULL DEFAULT 'personal',
      ADD "businessSettings" json NOT NULL DEFAULT '{}'
    `);

    // 인덱스 추가
    await queryRunner.query(`
      CREATE INDEX "IDX_ai_settings_chat_mode" ON "ai_settings" ("chatMode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 인덱스 제거
    await queryRunner.query(`DROP INDEX "IDX_ai_settings_chat_mode"`);

    // 컬럼 제거
    await queryRunner.query(`
      ALTER TABLE "ai_settings" 
      DROP COLUMN "businessSettings",
      DROP COLUMN "chatMode"
    `);

    // Enum 타입 제거
    await queryRunner.query(`DROP TYPE "public"."chat_mode_enum"`);
  }
}
