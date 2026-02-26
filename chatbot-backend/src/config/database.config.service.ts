import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  private readonly logger = new Logger(DatabaseConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    this.logger.debug('[TypeORM] createTypeOrmOptions 실행 - 데이터베이스 연결 설정 시작');

    const dbHost = this.configService.get<string>('database.host');
    const dbPort = this.configService.get<number>('database.port');
    const dbName = this.configService.get<string>('database.database');
    const dbUser = this.configService.get<string>('database.username');
    const dbPass = this.configService.get<string>('database.password');

    this.logger.debug(
      `[TypeORM] 데이터베이스 연결 정보: ${dbHost}:${dbPort}/${dbName}`,
    );

    return {
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: dbName,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production', // 개발 환경에서만 true 권장
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === 'development',
    };
  }
}
