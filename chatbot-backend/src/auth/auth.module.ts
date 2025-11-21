import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './entity/user.entity';
import { UsersModule } from '../users/user.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { KakaoStrategy } from './strategies/kakao.strategy';
import { EncryptionService } from '../common/services/encryption.service';

/**
 * 인증 관련 기능을 제공하는 전역 모듈
 * JWT 기반 인증과 사용자 관리를 담당합니다.
 */
@Global()
@Module({
  imports: [
    // 데이터베이스 엔티티 등록
    TypeOrmModule.forFeature([User]),

    // Passport 모듈
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 모듈 설정 (환경변수 검증과 함께)
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('security.jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('security.jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),

    // 사용자 관리 모듈
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    GoogleStrategy,
    KakaoStrategy,
    EncryptionService,
  ],
  exports: [AuthService, JwtAuthGuard], // 다른 모듈에서 사용 가능하도록 내보내기
})
export class AuthModule {}
