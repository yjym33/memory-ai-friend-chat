import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationAndUserTypes1700000000001
  implements MigrationInterface
{
  name = 'AddOrganizationAndUserTypes1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Organization 테이블 생성
    await queryRunner.query(`
      CREATE TYPE "public"."organization_type_enum" AS ENUM(
        'startup', 'sme', 'enterprise', 'non_profit', 'government', 'education'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."subscription_tier_enum" AS ENUM(
        'free', 'basic', 'professional', 'enterprise'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "organization" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "description" character varying,
        "type" "public"."organization_type_enum" NOT NULL DEFAULT 'startup',
        "subscriptionTier" "public"."subscription_tier_enum" NOT NULL DEFAULT 'free',
        "domain" character varying,
        "website" character varying,
        "settings" json NOT NULL DEFAULT '{}',
        "billingInfo" json NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_organization_name" UNIQUE ("name"),
        CONSTRAINT "PK_organization_id" PRIMARY KEY ("id")
      )
    `);

    // User 테이블에 새로운 컬럼들 추가
    await queryRunner.query(`
      CREATE TYPE "public"."user_type_enum" AS ENUM('individual', 'business')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."user_role_enum" AS ENUM(
        'user', 'admin', 'super_admin', 'org_admin', 'org_member'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD "userType" "public"."user_type_enum" NOT NULL DEFAULT 'individual',
      ADD "role" "public"."user_role_enum" NOT NULL DEFAULT 'user',
      ADD "organizationId" uuid,
      ADD "businessProfile" json NOT NULL DEFAULT '{}'
    `);

    // Foreign key 추가
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD CONSTRAINT "FK_user_organization" 
      FOREIGN KEY ("organizationId") 
      REFERENCES "organization"("id") 
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // User 테이블 변경사항 되돌리기
    await queryRunner.query(`
      ALTER TABLE "user" DROP CONSTRAINT "FK_user_organization"
    `);

    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN "businessProfile",
      DROP COLUMN "organizationId",
      DROP COLUMN "role",
      DROP COLUMN "userType"
    `);

    await queryRunner.query(`DROP TYPE "public"."user_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_type_enum"`);

    // Organization 테이블 삭제
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TYPE "public"."subscription_tier_enum"`);
    await queryRunner.query(`DROP TYPE "public"."organization_type_enum"`);
  }
}
