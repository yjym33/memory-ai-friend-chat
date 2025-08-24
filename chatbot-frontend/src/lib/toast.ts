import toast from "react-hot-toast";

// Toast 유틸리티 함수들
export const toastUtils = {
  /**
   * 성공 메시지 Toast
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * 에러 메시지 Toast
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * 정보 메시지 Toast
   */
  info: (message: string) => {
    toast(message, {
      icon: "ℹ️",
    });
  },

  /**
   * 경고 메시지 Toast
   */
  warning: (message: string) => {
    toast(message, {
      icon: "⚠️",
      style: {
        background: "#f59e0b",
        color: "#fff",
      },
    });
  },

  /**
   * 로딩 Toast (Promise와 함께 사용)
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Promise를 위한 Toast (자동으로 성공/실패 메시지 표시)
   */
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Toast 제거
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * 모든 Toast 제거
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

// 편의를 위한 직접 export
export const {
  success,
  error,
  info,
  warning,
  loading,
  promise: toastPromise,
} = toastUtils;

export default toastUtils;
