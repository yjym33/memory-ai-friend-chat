import { Request } from 'express';

/**
 * 인증된 사용자 정보를 포함한 Request 타입
 */
import { UserType } from '../../auth/entity/user.entity';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string; // UUID
    userId: string; // JWT에서 오는 userId
    email: string;
    name: string;
    userType?: UserType;
    organizationId?: string;
    [key: string]: any;
  };
}
