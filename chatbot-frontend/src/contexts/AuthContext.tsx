'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axiosInstance from '../utils/axios';

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  login: (token: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUserId = localStorage.getItem('userId');

      if (token && storedUserId) {
        try {
          // 토큰 유효성 검증
          await axiosInstance.get('/auth/validate');
          setIsAuthenticated(true);
          setUserId(storedUserId);
        } catch (error) {
          // 토큰이 유효하지 않은 경우
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          if (!pathname.includes('/login')) {
            router.push('/login');
          }
        }
      } else if (!pathname.includes('/login')) {
        router.push('/login');
      }
      setIsLoading(false);
    };

    validateAuth();
  }, [router, pathname]);

  if (isLoading) {
    return null; // 또는 로딩 스피너
  }

  const login = (token: string, userId: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    setIsAuthenticated(true);
    setUserId(userId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
} 