import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 어디서든 환경 변수 사용 가능하도록 설정
    }),
  ],
})
export class AppConfigModule {}
