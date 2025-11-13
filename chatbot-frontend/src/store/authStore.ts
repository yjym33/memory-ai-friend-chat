import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axiosInstance from "../utils/axios";
import { RegisterData } from "../types";
import { AuthService } from "../services";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  userType: string | null;
  role: string | null;
  organizationId: string | null;
  isHydrated: boolean;
  userEmail: string | null; // 추가: 사용자 이메일
  userName: string | null; // 추가: 사용자 이름

  // 기존 메서드
  login: (
    token: string,
    userId: string,
    userType?: string,
    role?: string,
    organizationId?: string
  ) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;

  // 추가: 회원가입 관련 메서드
  register: (data: RegisterData) => Promise<void>;
  setUserInfo: (email: string, name: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      userId: null,
      userType: null,
      role: null,
      organizationId: null,
      isHydrated: false,
      userEmail: null,
      userName: null,
      login: (
        token: string,
        userId: string,
        userType?: string,
        role?: string,
        organizationId?: string
      ) => {
        set((state) => ({
          ...state,
          isAuthenticated: true,
          token,
          userId,
          userType,
          role,
          organizationId,
        }));
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        if (userType) localStorage.setItem("userType", userType);
        if (role) localStorage.setItem("role", role);
        if (organizationId)
          localStorage.setItem("organizationId", organizationId);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      },

      logout: () => {
        set((state) => ({
          ...state,
          isAuthenticated: false,
          token: null,
          userId: null,
          userType: null,
          role: null,
          organizationId: null,
          userEmail: null,
          userName: null,
        }));
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("userType");
        localStorage.removeItem("role");
        localStorage.removeItem("organizationId");
        delete axiosInstance.defaults.headers.common["Authorization"];
      },

      validateToken: async () => {
        try {
          const userData = await AuthService.validateToken();
          // 사용자 정보 업데이트
          set((state) => ({
            ...state,
            isAuthenticated: true,
            userEmail: userData.email,
            userName: userData.name,
          }));
          return true;
        } catch {
          set((state) => ({
            ...state,
            isAuthenticated: false,
            token: null,
            userId: null,
            userEmail: null,
            userName: null,
          }));
          return false;
        }
      },

      // 추가: 회원가입 메서드
      register: async (data: RegisterData) => {
        try {
          const response = await AuthService.register(data);
          const { token, userId, userType, role, organizationId } = response;
          set((state) => ({
            ...state,
            isAuthenticated: true,
            token,
            userId,
            userType,
            role,
            organizationId,
            userEmail: data.email,
            userName: data.name,
          }));
          localStorage.setItem("token", token);
          localStorage.setItem("userId", userId);
          if (userType) localStorage.setItem("userType", userType);
          if (role) localStorage.setItem("role", role);
          if (organizationId)
            localStorage.setItem("organizationId", organizationId);
        } catch (error) {
          console.error("회원가입 실패:", error);
          throw error;
        }
      },

      // 추가: 사용자 정보 설정 메서드
      setUserInfo: (email: string, name: string) => {
        set({ userEmail: email, userName: name });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({
        token: state.token,
        userId: state.userId,
        userType: state.userType,
        role: state.role,
        organizationId: state.organizationId,
        isAuthenticated: state.isAuthenticated,
        userEmail: state.userEmail, // 추가
        userName: state.userName, // 추가
      }),
      onRehydrateStorage: () => (state?: AuthState) => {
        if (state) {
          state.isHydrated = true;
        }
      },
    }
  )
);
