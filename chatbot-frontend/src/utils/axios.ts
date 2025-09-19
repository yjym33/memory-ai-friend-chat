import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

// 요청 인터셉터 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState(); // ✅ Zustand에서 직접 가져옴
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    // FormData 전송 시 Content-Type은 브라우저가 boundary 포함하여 자동 설정하도록 둔다
    const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;
    if (isFormData) {
      // axios가 헤더를 자동으로 설정하도록 강제
      if (config.headers) {
        delete (config.headers as any)["Content-Type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 401 에러 발생 시 로그인 페이지로 리다이렉트
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      // 클라이언트 사이드에서만 리다이렉트
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
