import {
  Controller,
  Post,
  Put,
  Body,
  Get,
  Request,
  UseGuards,
  Res,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { KakaoOAuthGuard } from './guards/kakao-oauth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthenticatedRequest, OAuthUser } from '../common/types/request.types';
import { LLMProvider } from '../llm/types/llm.types';

/**
 * OAuth 콜백에서 사용되는 Request 타입
 */
interface OAuthRequest extends ExpressRequest {
  user: OAuthUser;
}

/**
 * 인증 관련 API를 처리하는 컨트롤러
 * 로그인, 회원가입, 토큰 검증 등의 엔드포인트를 제공합니다.
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {
    this.logger.debug('[AuthController] Constructor 실행 - 인증 컨트롤러 초기화');
  }

  /**
   * 사용자 로그인을 처리합니다.
   * @param loginDto - 로그인 정보 (이메일, 비밀번호)
   * @returns 사용자 ID와 JWT 토큰
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    this.logger.debug(`[login] 호출 - email: ${loginDto.email}`);
    const result = await this.authService.login(
      loginDto.email,
      loginDto.password,
    );
    this.logger.debug(`[login] 완료 - userId: ${result.userId}`);
    return result;
  }

  /**
   * 새로운 사용자 등록을 처리합니다.
   * @param registerDto - 회원가입 정보
   * @returns 등록된 사용자 ID와 JWT 토큰
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.debug(`[register] 호출 - email: ${registerDto.email}`);
    const { email, password, name, gender, birthYear } = registerDto;
    const result = await this.authService.register(
      email,
      password,
      name,
      gender,
      birthYear,
    );
    this.logger.debug(`[register] 완료 - userId: ${result.userId}`);
    return result;
  }

  /**
   * JWT 토큰의 유효성을 검증합니다.
   * @param req - 요청 객체 (JWT 토큰 포함)
   * @returns 검증된 사용자 ID
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req: AuthenticatedRequest) {
    this.logger.debug(`[validateToken] 호출 - userId: ${req.user.userId}`);
    return { userId: req.user.userId };
  }

  /**
   * 구글 로그인을 시작합니다.
   */
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Guard가 자동으로 구글 로그인 페이지로 리다이렉트
  }

  /**
   * 구글 로그인 콜백을 처리합니다.
   */
  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@Request() req: OAuthRequest, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(req.user);

    // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&userId=${result.userId}`,
    );
  }

  /**
   * 카카오 로그인을 시작합니다.
   */
  @Get('kakao')
  @UseGuards(KakaoOAuthGuard)
  async kakaoAuth() {
    // Guard가 자동으로 카카오 로그인 페이지로 리다이렉트
  }

  /**
   * 카카오 로그인 콜백을 처리합니다.
   */
  @Get('kakao/callback')
  @UseGuards(KakaoOAuthGuard)
  async kakaoAuthCallback(@Request() req: OAuthRequest, @Res() res: Response) {
    const result = await this.authService.validateOAuthLogin(req.user);

    // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/auth/callback?token=${result.token}&userId=${result.userId}`,
    );
  }

  /**
   * 사용자의 LLM API 키를 업데이트합니다.
   * @param req - 요청 객체 (JWT 토큰 포함)
   * @param body - API 키 정보 (provider, apiKey)
   * @returns 업데이트 성공 메시지
   */
  @Put('api-keys')
  @UseGuards(JwtAuthGuard)
  async updateApiKey(
    @Request() req: AuthenticatedRequest,
    @Body() body: { provider: LLMProvider; apiKey: string },
  ) {
    this.logger.debug(
      `[updateApiKey] 호출 - userId: ${req.user.userId}, provider: ${body.provider}`,
    );
    await this.authService.updateApiKey(
      req.user.userId,
      body.provider,
      body.apiKey,
    );
    this.logger.debug(`[updateApiKey] 완료 - userId: ${req.user.userId}`);
    return { message: 'API 키가 성공적으로 저장되었습니다.' };
  }

  /**
   * 사용자의 모든 LLM API 키를 업데이트합니다.
   * @param req - 요청 객체 (JWT 토큰 포함)
   * @param body - API 키 객체 (openai, google, anthropic)
   * @returns 업데이트 성공 메시지
   */
  @Put('api-keys/all')
  @UseGuards(JwtAuthGuard)
  async updateApiKeys(
    @Request() req: AuthenticatedRequest,
    @Body()
    body: { apiKeys: { openai?: string; google?: string; anthropic?: string } },
  ) {
    this.logger.debug(
      `[updateApiKeys] 호출 - userId: ${req.user.userId}, providers: ${Object.keys(body.apiKeys).join(', ')}`,
    );
    console.log('📥 API 키 저장 요청:', {
      userId: req.user.userId,
      providers: Object.keys(body.apiKeys),
      hasAnthropic: !!body.apiKeys.anthropic,
    });

    await this.authService.updateApiKeys(req.user.userId, body.apiKeys);
    this.logger.debug(`[updateApiKeys] 완료 - userId: ${req.user.userId}`);
    return { message: 'API 키들이 성공적으로 저장되었습니다.' };
  }

  /**
   * 사용자의 API 키 저장 여부를 확인합니다.
   * @param req - 요청 객체 (JWT 토큰 포함)
   * @returns API 키 저장 여부
   */
  @Get('api-keys/status')
  @UseGuards(JwtAuthGuard)
  async getApiKeysStatus(@Request() req: AuthenticatedRequest) {
    this.logger.debug(
      `[getApiKeysStatus] 호출 - userId: ${req.user.userId}`,
    );
    const user = await this.authService.getUserById(req.user.userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    this.logger.debug(`[getApiKeysStatus] 완료 - userId: ${req.user.userId}`);
    return {
      hasOpenAI: !!user.llmApiKeys?.openai,
      hasGoogle: !!user.llmApiKeys?.google,
      hasAnthropic: !!user.llmApiKeys?.anthropic,
    };
  }
}
