import { Request } from 'express';
import { UserType } from '../../auth/entity/user.entity';

/**
 * 인증된 사용자 정보
 */
export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  name: string;
  userType?: UserType;
  organizationId?: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * 인증된 사용자 정보를 포함한 Request 타입
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * OAuth 프로바이더에서 반환하는 사용자 정보
 */
export interface OAuthUser {
  providerId: string;
  provider: 'google' | 'kakao';
  email: string;
  name: string;
  profileImage?: string;
}
