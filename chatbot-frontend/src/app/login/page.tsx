'use client';

import { useState } from 'react';
import { useLogin } from '../../hooks/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl text-blue-500 font-bold mb-6 text-center">
          로그인
        </h1>
        {login.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              required
            />
          </div>
          <button
            type="submit"
            disabled={login.isPending}
            className={`w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 ${
              login.isPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {login.isPending ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <a href="/register" className="text-blue-500 hover:text-blue-600">
            회원가입
          </a>
        </div>
      </div>
    </div>
  );
}