import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 초기 스키마 마이그레이션
 * 기존 synchronize로 생성된 테이블 구조를 마이그레이션으로 정의합니다.
 */
export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // User 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "name" character varying,
        "gender" character varying NOT NULL DEFAULT 'male',
        "birthYear" character varying NOT NULL DEFAULT '2000',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_email" UNIQUE ("email"),
        CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
      )
    `);

    // Conversation 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "conversation" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL DEFAULT '새 대화',
        "messages" jsonb NOT NULL,
        "userId" uuid NOT NULL,
        "pinned" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversation_id" PRIMARY KEY ("id")
      )
    `);

    // Goals 테이블 생성
    await queryRunner.query(`
      CREATE TYPE "goal_category_enum" AS ENUM(
        'health', 'career', 'education', 'relationship', 
        'finance', 'personal', 'hobby', 'travel', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "goal_status_enum" AS ENUM(
        'active', 'completed', 'paused', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "goals" (
        "id" SERIAL NOT NULL,
        "user_id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text,
        "category" "goal_category_enum" NOT NULL DEFAULT 'personal',
        "status" "goal_status_enum" NOT NULL DEFAULT 'active',
        "progress" integer NOT NULL DEFAULT 0,
        "targetDate" date,
        "priority" integer NOT NULL DEFAULT 5,
        "milestones" json,
        "lastCheckedAt" date,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_goals_id" PRIMARY KEY ("id")
      )
    `);

    // Emotions 테이블 생성
    await queryRunner.query(`
      CREATE TYPE "emotion_type_enum" AS ENUM(
        'happy', 'sad', 'angry', 'anxious', 'excited',
        'frustrated', 'calm', 'stressed', 'confused', 'proud'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "emotions" (
        "id" SERIAL NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "emotion_type_enum" NOT NULL,
        "intensity" integer NOT NULL DEFAULT 5,
        "context" text,
        "trigger" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emotions_id" PRIMARY KEY ("id")
      )
    `);

    // AiSettings 테이블 생성
    await queryRunner.query(`
      CREATE TABLE "ai_settings" (
        "id" SERIAL NOT NULL,
        "userId" uuid NOT NULL,
        "personalityType" character varying NOT NULL DEFAULT '친근함',
        "speechStyle" character varying NOT NULL DEFAULT '반말',
        "emojiUsage" integer NOT NULL DEFAULT 3,
        "nickname" character varying,
        "empathyLevel" integer NOT NULL DEFAULT 3,
        "memoryRetentionDays" integer NOT NULL DEFAULT 90,
        "memoryPriorities" json NOT NULL DEFAULT '{}',
        "userProfile" json NOT NULL DEFAULT '{}',
        "avoidTopics" json NOT NULL DEFAULT '[]',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_ai_settings_userId" UNIQUE ("userId")
      )
    `);

    // Foreign Key 제약조건 추가
    await queryRunner.query(`
      ALTER TABLE "conversation" 
      ADD CONSTRAINT "FK_conversation_userId" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "goals" 
      ADD CONSTRAINT "FK_goals_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "emotions" 
      ADD CONSTRAINT "FK_emotions_user_id" 
      FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "ai_settings" 
      ADD CONSTRAINT "FK_ai_settings_userId" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Foreign Key 제약조건 제거
    await queryRunner.query(
      `ALTER TABLE "ai_settings" DROP CONSTRAINT "FK_ai_settings_userId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "emotions" DROP CONSTRAINT "FK_emotions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "goals" DROP CONSTRAINT "FK_goals_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "conversation" DROP CONSTRAINT "FK_conversation_userId"`,
    );

    // 테이블 제거
    await queryRunner.query(`DROP TABLE "ai_settings"`);
    await queryRunner.query(`DROP TABLE "emotions"`);
    await queryRunner.query(`DROP TYPE "emotion_type_enum"`);
    await queryRunner.query(`DROP TABLE "goals"`);
    await queryRunner.query(`DROP TYPE "goal_status_enum"`);
    await queryRunner.query(`DROP TYPE "goal_category_enum"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
