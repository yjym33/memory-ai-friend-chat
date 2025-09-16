import { Request } from 'express';

/**
 * 인증된 사용자 정보를 포함한 Request 타입
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    name: string;
    [key: string]: any;
  };
}
