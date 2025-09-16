import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest } from '../common/types/request.types';

/**
 * 인증 관련 API를 처리하는 컨트롤러
 * 로그인, 회원가입, 토큰 검증 등의 엔드포인트를 제공합니다.
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 사용자 로그인을 처리합니다.
   * @param loginDto - 로그인 정보 (이메일, 비밀번호)
   * @returns 사용자 ID와 JWT 토큰
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * 새로운 사용자 등록을 처리합니다.
   * @param registerDto - 회원가입 정보
   * @returns 등록된 사용자 ID와 JWT 토큰
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const { email, password, name, gender, birthYear } = registerDto;
    return this.authService.register(email, password, name, gender, birthYear);
  }

  /**
   * JWT 토큰의 유효성을 검증합니다.
   * @param req - 요청 객체 (JWT 토큰 포함)
   * @returns 검증된 사용자 ID
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req: AuthenticatedRequest) {
    return { userId: req.user.userId };
  }
}
