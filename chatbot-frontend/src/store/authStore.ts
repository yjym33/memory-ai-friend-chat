import axiosInstance from "@/utils/axios";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { RegisterData } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  isHydrated: boolean;
  userEmail: string | null; // 추가: 사용자 이메일
  userName: string | null; // 추가: 사용자 이름

  // 기존 메서드
  login: (token: string, userId: string) => void;
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
      isHydrated: false,
      userEmail: null,
      userName: null,
      login: (token: string, userId: string) => {
        set((state) => ({ ...state, isAuthenticated: true, token, userId }));
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
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
          userEmail: null,
          userName: null,
        }));
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        delete axiosInstance.defaults.headers.common["Authorization"];
      },

      validateToken: async () => {
        try {
          await axiosInstance.get("/auth/validate");
          return true;
        } catch (error) {
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
          const response = await axiosInstance.post("/auth/register", data);
          const { token, userId } = response.data;
          set((state) => ({
            ...state,
            isAuthenticated: true,
            token,
            userId,
            userEmail: data.email,
            userName: data.name,
          }));
          axiosInstance.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${token}`;
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
