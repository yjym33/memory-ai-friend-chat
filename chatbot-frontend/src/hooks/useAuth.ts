import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthService } from "../services";
import { useAuthStore } from "../store/authStore";
import { LoginData } from "../types";

interface RegisterCredentials {
  email: string;
  password: string;
  passwordCheck: string;
  name: string;
  birthYear: string;
  gender: string;
}

export function useLogin() {
  const router = useRouter();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await AuthService.login(credentials);
    },
    onSuccess: (data) => {
      login(data.token, data.userId);
      router.push(`/chat/${data.userId}`);
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const { login } = useAuthStore();

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      // RegisterCredentials를 RegisterData로 변환
      const { passwordCheck, ...registerData } = credentials;
      // passwordCheck는 프론트엔드에서만 사용하므로 백엔드에 전송하지 않음
      void passwordCheck;
      return await AuthService.register(registerData);
    },
    onSuccess: (data) => {
      login(data.token, data.userId);
      router.push(`/chat/${data.userId}`);
    },
  });
}
