import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import axiosInstance from "../utils/axios";
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
      const response = await axiosInstance.post("/auth/login", credentials);
      return response.data;
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
      const response = await axiosInstance.post("/auth/register", credentials);
      return response.data;
    },
    onSuccess: (data) => {
      login(data.token, data.userId);
      router.push(`/chat/${data.userId}`);
    },
  });
}
