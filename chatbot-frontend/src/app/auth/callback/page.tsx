"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import { success as toastSuccess, error as toastError } from "../../../lib/toast";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (token && userId) {
      // 토큰과 사용자 ID를 저장
      setAuth(token, userId);
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      
      toastSuccess("소셜 로그인에 성공했습니다! 🎉");
      
      // 메인 페이지로 리다이렉트
      router.push("/");
    } else {
      toastError("로그인에 실패했습니다. 다시 시도해주세요.");
      router.push("/login");
    }
  }, [searchParams, setAuth, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center p-6">
      <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          로그인 처리 중...
        </h2>
        <p className="text-gray-600">잠시만 기다려주세요.</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center p-6">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              로딩 중...
            </h2>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

