import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AuthService } from "../services";
import { useAuthStore } from "../store/authStore";
import { LoginData } from "../types";
import { error as toastError } from "../lib/toast";

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
    onError: (error: unknown) => {
      console.error("로그인 실패:", error);
      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 401) {
        toastError("이메일 또는 비밀번호가 잘못되었습니다.");
      } else {
        toastError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
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
    onError: (error: unknown) => {
      console.error("회원가입 실패:", error);

      const apiError = error as { response?: { status?: number } };
      if (apiError.response?.status === 409) {
        toastError("이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.");
      } else if (apiError.response?.status === 400) {
        toastError("입력 정보를 확인해주세요.");
      } else {
        toastError(
          "회원가입 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    },
  });
}
