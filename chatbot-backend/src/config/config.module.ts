import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어디서든 환경 변수 사용 가능하도록 설정
    }),
  ],
})
export class AppConfigModule {
  private readonly logger = new Logger(AppConfigModule.name);

  constructor() {
    this.logger.debug('[AppConfigModule] Constructor 실행');
  }
}
