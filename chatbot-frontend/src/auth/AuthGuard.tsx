"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../store/authStore";

const publicPaths = ["/login", "/register", "/forgot-password", "/"];

// 로딩 컴포넌트
function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, token, logout, isHydrated, validateToken } =
    useAuthStore();

  useEffect(() => {
    if (!isHydrated) return; // zustand가 초기화될 때까지 기다림

    setMounted(true);

    const validateAuth = async () => {
      setIsValidating(true);

      // 공개 경로는 인증 검증 없이 통과
      if (publicPaths.includes(pathname)) {
        setIsValidating(false);
        return;
      }

      if (!token) {
        router.push("/login");
        setIsValidating(false);
        return;
      }

      try {
        const isValid = await validateToken();
        if (!isValid) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Token validation error:", error);
        logout();
        router.push("/login");
      } finally {
        setIsValidating(false);
      }
    };

    validateAuth();
  }, [pathname, token, router, logout, isHydrated, validateToken]);

  // 초기화 중이거나 검증 중일 때 로딩 표시
  if (!mounted || !isHydrated || isValidating) {
    return <AuthLoadingSpinner />;
  }

  // 공개 경로는 항상 허용
  if (publicPaths.includes(pathname)) {
    return <>{children}</>;
  }

  // 인증되지 않은 사용자는 아무것도 렌더링하지 않음
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
