import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOAuthFields1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // password 컬럼을 nullable로 변경
    await queryRunner.changeColumn(
      'user',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // provider 컬럼 추가
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'provider',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // providerId 컬럼 추가
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'providerId',
        type: 'varchar',
        isNullable: true,
      }),
    );

    // profileImage 컬럼 추가
    await queryRunner.addColumn(
      'user',
      new TableColumn({
        name: 'profileImage',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 컬럼 제거 (롤백)
    await queryRunner.dropColumn('user', 'profileImage');
    await queryRunner.dropColumn('user', 'providerId');
    await queryRunner.dropColumn('user', 'provider');

    // password 컬럼을 다시 NOT NULL로 변경
    await queryRunner.changeColumn(
      'user',
      'password',
      new TableColumn({
        name: 'password',
        type: 'varchar',
        isNullable: false,
      }),
    );
  }
}

