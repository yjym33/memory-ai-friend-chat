import axiosInstance from "../utils/axios";
import { LoginData, RegisterData, AuthResponse, User } from "../types";

export class AuthService {
  /**
   * 사용자 로그인
   */
  static async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/login",
      credentials
    );
    return response.data;
  }

  /**
   * 사용자 회원가입
   */
  static async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>(
      "/auth/register",
      userData
    );
    return response.data;
  }

  /**
   * 토큰 유효성 검증
   */
  static async validateToken(): Promise<User> {
    const response = await axiosInstance.get<User>("/auth/validate");
    return response.data;
  }

  /**
   * 사용자 프로필 조회
   */
  static async getProfile(): Promise<User> {
    const response = await axiosInstance.get<User>("/auth/profile");
    return response.data;
  }

  /**
   * 사용자 프로필 업데이트
   */
  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await axiosInstance.put<User>("/auth/profile", userData);
    return response.data;
  }
}
