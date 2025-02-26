import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import axiosInstance from "../utils/axios";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  isHydrated: boolean; // ✅ persist 데이터가 로드되었는지 확인하는 상태

  login: (token: string, userId: string) => void;
  logout: () => void;
  validateToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      userId: null,
      isHydrated: false,

      login: (token, userId) => {
        set({ isAuthenticated: true, token, userId });
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        axiosInstance.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${token}`;
      },

      logout: () => {
        set({ isAuthenticated: false, token: null, userId: null });
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        delete axiosInstance.defaults.headers.common["Authorization"];
      },

      validateToken: async () => {
        try {
          await axiosInstance.get("/auth/validate");
          return true;
        } catch (error) {
          set({ isAuthenticated: false, token: null, userId: null });
          return false;
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true; // ✅ `zustand persist` 데이터 로드 완료 후 상태 변경
        }
      },
    }
  )
);
