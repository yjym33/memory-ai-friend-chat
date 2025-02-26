import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import axiosInstance from "../utils/axios";

const publicPaths = ["/login", "/register", "/forgot-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, logout, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return; // ✅ zustand가 초기화될 때까지 기다림

    setMounted(true);

    const validateAuth = async () => {
      if (!token) {
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
        return;
      }

      try {
        await axiosInstance.get("/auth/validate");
      } catch (error) {
        logout();
        if (!publicPaths.includes(pathname)) {
          router.push("/login");
        }
      }
    };

    validateAuth();
  }, [pathname, token, router, logout, isHydrated]);

  if (!mounted || !isHydrated) {
    return null; // ✅ `zustand`가 초기화되지 않으면 아무것도 렌더링하지 않음
  }

  if (publicPaths.includes(pathname)) {
    return children;
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}
