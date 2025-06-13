import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entity/user.entity';
import { UsersModule } from '../users/user.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/**
 * 인증 관련 기능을 제공하는 전역 모듈
 * JWT 기반 인증과 사용자 관리를 담당합니다.
 */
@Global()
@Module({
  imports: [
    // 데이터베이스 엔티티 등록
    TypeOrmModule.forFeature([User]),

    // JWT 모듈 설정
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' }, // 토큰 만료 시간 24시간
    }),

    // 사용자 관리 모듈
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard], // 다른 모듈에서 사용 가능하도록 내보내기
})
export class AuthModule {}
