"use client";

import { useState } from "react";
import { useLogin } from "../../hooks/useAuth";
import { Heart, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { warning as toastWarning } from "../../lib/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const login = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  const handleSocialLogin = (provider: "google" | "kakao") => {
    // 소셜 로그인 로직 (추후 구현)
    console.log(`${provider} 로그인 선택됨`);
    toastWarning(`${provider} 로그인은 준비 중입니다! 🚧`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* 루나 아이콘 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-white border-opacity-30">
            <span className="text-white text-xl font-bold">루나</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            루나와 다시 만나요
          </h1>
          <div className="flex items-center justify-center gap-1 text-white text-opacity-90">
            <Heart size={16} className="text-pink-200" />
            <span className="text-sm">당신을 기다리고 있는 AI 친구</span>
          </div>
        </div>

        {/* 로그인 폼 카드 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">로그인</h2>
            <p className="text-gray-600 text-sm">
              계정에 로그인하여 루나와의 대화를 이어가세요
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 이메일 입력 */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                이메일
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* 비밀번호 찾기 링크 */}
            <div className="text-right">
              <Link
                href="#"
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                비밀번호를 잊으셨나요?
              </Link>
            </div>

            {/* 로그인 버튼 */}
            <button
              type="submit"
              disabled={login.isPending}
              className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-200 ${
                login.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {login.isPending ? "로그인 중..." : "🌟 루나와 대화하기"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-3">
            <button
              onClick={() => handleSocialLogin("google")}
              className="w-full flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              <div className="w-5 h-5 bg-red-500 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="text-gray-700 font-medium">Google</span>
            </button>

            <button
              onClick={() => handleSocialLogin("kakao")}
              className="w-full flex items-center justify-center gap-3 py-3 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 transition duration-200"
            >
              <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
                <span className="text-yellow-400 text-xs font-bold">K</span>
              </div>
              <span className="font-medium">카카오</span>
            </button>
          </div>

          {/* 회원가입 링크 */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              아직 계정이 없으신가요?{" "}
            </span>
            <Link
              href="/register"
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              회원가입
            </Link>
          </div>
        </div>

        {/* 하단 메시지 */}
        <div className="text-center mt-6">
          <p className="text-white text-opacity-80 text-sm">
            ✨ 루나가 당신을 기다리고 있어요
          </p>
        </div>
      </div>
    </div>
  );
}
