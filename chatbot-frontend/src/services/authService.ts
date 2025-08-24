import { LoginData, RegisterData, AuthResponse, User } from "../types";
import { BaseService } from "./baseService";

export class AuthService extends BaseService {
  /**
   * 사용자 로그인
   */
  static async login(credentials: LoginData): Promise<AuthResponse> {
    return BaseService.post<AuthResponse>("/auth/login", credentials);
  }

  /**
   * 사용자 회원가입
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    return BaseService.post<AuthResponse>("/auth/register", userData);
  }

  /**
   * 토큰 유효성 검증
   */
  static async validateToken(): Promise<User> {
    return BaseService.get<User>("/auth/validate");
  }

  /**
   * 사용자 프로필 조회
   */
  static async getProfile(): Promise<User> {
    return BaseService.get<User>("/auth/profile");
  }

  /**
   * 사용자 프로필 업데이트
   */
  static async updateProfile(userData: Partial<User>): Promise<User> {
    return BaseService.put<User>("/auth/profile", userData);
  }
}
