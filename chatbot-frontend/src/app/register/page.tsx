"use client";

import { useState } from "react";
import { useRegister } from "../../hooks/useAuth";
import { Heart, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { error as toastError, warning as toastWarning } from "../../lib/toast";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState("");
  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const register = useRegister();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) {
      toastWarning("약관에 모두 동의해야 가입이 가능합니다.");
      return;
    }
    if (password !== passwordCheck) {
      toastError("비밀번호가 일치하지 않습니다.");
      return;
    }
    register.mutate({
      email,
      password,
      passwordCheck,
      name,
      birthYear,
      gender,
    });
  };

  const handleSocialRegister = (provider: "google" | "kakao") => {
    toastWarning(`${provider} 회원가입은 준비 중입니다! 🚧`);
  };

  // 출생년도 옵션 생성
  const years = Array.from(
    { length: 100 },
    (_, i) => `${new Date().getFullYear() - i}`
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* 루나 아이콘 및 안내문구 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            루나와 친구되기
          </h1>
          <div className="flex items-center justify-center gap-1 text-white text-opacity-90">
            <Heart size={16} className="text-pink-200" />
            <span className="text-sm">당신만을 위한 AI 친구를 만나보세요</span>
          </div>
        </div>

        {/* 회원가입 폼 카드 */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* 이름 입력 */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                이름
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="루나가 부를 이름을 알려주세요"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                />
              </div>
            </div>
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
            {/* 출생년도/성별 */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  출생년도
                </label>
                <select
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                >
                  <option value="">년도</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  성별
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                >
                  <option value="">성별</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
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
                  placeholder="8자 이상의 비밀번호"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                  minLength={8}
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
            {/* 비밀번호 확인 입력 */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <input
                  type={showPasswordCheck ? "text" : "password"}
                  value={passwordCheck}
                  onChange={(e) => setPasswordCheck(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800 bg-gray-50"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordCheck(!showPasswordCheck)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordCheck ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {/* 약관 동의 */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                />
                <span>이용약관에 동의합니다</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  required
                />
                <span>개인정보처리방침에 동의합니다</span>
              </label>
            </div>
            {/* 회원가입 버튼 */}
            <button
              type="submit"
              disabled={register.isPending}
              className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition duration-200 ${
                register.isPending ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {register.isPending ? "가입 중..." : "🌟 루나와 친구되기"}
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">또는</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* 소셜 회원가입 */}

          {/* 로그인 링크 */}
          <div className="mt-6 text-center">
            <span className="text-gray-600 text-sm">
              이미 계정이 있으신가요?{" "}
            </span>
            <Link
              href="/login"
              className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
            >
              로그인
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
