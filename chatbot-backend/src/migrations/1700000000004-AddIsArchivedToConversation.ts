import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsArchivedToConversation1700000000004
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // conversation 테이블에 isArchived 컬럼 추가
    await queryRunner.addColumn(
      'conversation',
      new TableColumn({
        name: 'isArchived',
        type: 'boolean',
        default: false,
      }),
    );

    console.log('✅ isArchived 컬럼이 conversation 테이블에 추가되었습니다.');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백: isArchived 컬럼 제거
    await queryRunner.dropColumn('conversation', 'isArchived');

    console.log('⏪ isArchived 컬럼이 conversation 테이블에서 제거되었습니다.');
  }
}

