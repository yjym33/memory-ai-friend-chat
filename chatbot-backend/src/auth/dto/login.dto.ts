import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 로그인 요청 데이터 전송 객체
 */
export class LoginDto {
  /**
   * 사용자 이메일
   * @example "user@example.com"
   */
  @IsEmail()
  email: string;

  /**
   * 사용자 비밀번호
   * @example "password123"
   */
  @IsString()
  @MinLength(6)
  password: string;
}
