import React from "react";
import {
  AppError,
  ErrorAction,
  ErrorCategory,
  ErrorSeverity,
} from "../../types/error";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Wifi,
  Lock,
  Shield,
  CheckCircle,
  X,
  RefreshCw,
} from "lucide-react";

interface ErrorDisplayProps {
  error: AppError;
  actions?: ErrorAction[];
  onClose?: () => void;
  showCloseButton?: boolean;
  compact?: boolean;
  className?: string;
}

// 에러 아이콘 매핑
const getErrorIcon = (error: AppError) => {
  switch (error.category) {
    case ErrorCategory.NETWORK:
      return <Wifi className="w-5 h-5" />;
    case ErrorCategory.AUTHENTICATION:
      return <Lock className="w-5 h-5" />;
    case ErrorCategory.AUTHORIZATION:
      return <Shield className="w-5 h-5" />;
    default:
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
        case ErrorSeverity.HIGH:
          return <AlertTriangle className="w-5 h-5" />;
        case ErrorSeverity.MEDIUM:
          return <AlertCircle className="w-5 h-5" />;
        case ErrorSeverity.LOW:
          return <Info className="w-5 h-5" />;
        default:
          return <AlertCircle className="w-5 h-5" />;
      }
  }
};

// 에러 색상 매핑
const getErrorColors = (error: AppError) => {
  switch (error.severity) {
    case ErrorSeverity.CRITICAL:
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
        icon: "text-red-600",
      };
    case ErrorSeverity.HIGH:
      return {
        bg: "bg-orange-50",
        border: "border-orange-200",
        text: "text-orange-800",
        icon: "text-orange-600",
      };
    case ErrorSeverity.MEDIUM:
      return {
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        text: "text-yellow-800",
        icon: "text-yellow-600",
      };
    case ErrorSeverity.LOW:
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
        icon: "text-blue-600",
      };
    default:
      return {
        bg: "bg-gray-50",
        border: "border-gray-200",
        text: "text-gray-800",
        icon: "text-gray-600",
      };
  }
};

export function ErrorDisplay({
  error,
  actions = [],
  onClose,
  showCloseButton = true,
  compact = false,
  className = "",
}: ErrorDisplayProps) {
  const colors = getErrorColors(error);
  const icon = getErrorIcon(error);
  const message = error.userMessage || error.message;

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border rounded-lg p-4 ${className}
      `}
    >
      <div className="flex items-start">
        <div className={`${colors.icon} mr-3 mt-0.5`}>{icon}</div>

        <div className="flex-1 min-w-0">
          {!compact && (
            <h3 className="text-sm font-medium mb-1">
              {error.category === ErrorCategory.NETWORK && "네트워크 오류"}
              {error.category === ErrorCategory.AUTHENTICATION && "인증 오류"}
              {error.category === ErrorCategory.AUTHORIZATION && "권한 오류"}
              {error.category === ErrorCategory.VALIDATION && "입력 오류"}
              {error.category === ErrorCategory.API && "서버 오류"}
              {error.category === ErrorCategory.UI && "화면 오류"}
              {error.category === ErrorCategory.SYSTEM && "시스템 오류"}
              {error.category === ErrorCategory.UNKNOWN && "알 수 없는 오류"}
            </h3>
          )}

          <p className={`text-sm ${compact ? "font-medium" : ""}`}>{message}</p>

          {/* 개발 모드에서 추가 정보 표시 */}
          {process.env.NODE_ENV === "development" && !compact && (
            <details className="mt-2">
              <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                개발자 정보
              </summary>
              <div className="mt-1 text-xs opacity-70">
                <p>ID: {error.id}</p>
                <p>카테고리: {error.category}</p>
                <p>심각도: {error.severity}</p>
                <p>시간: {error.timestamp.toLocaleString()}</p>
                {error.context && (
                  <pre className="mt-1 overflow-auto max-h-20 text-xs">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* 액션 버튼들 */}
          {(actions.length > 0 || error.retryable) && (
            <div className="mt-3 flex gap-2">
              {error.retryable && (
                <button
                  onClick={() => window.location.reload()}
                  className={`
                    inline-flex items-center gap-1 px-3 py-1 text-xs font-medium
                    bg-white border ${colors.border} ${colors.text}
                    rounded hover:bg-gray-50 transition-colors
                  `}
                >
                  <RefreshCw className="w-3 h-3" />
                  다시 시도
                </button>
              )}

              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`
                    px-3 py-1 text-xs font-medium rounded transition-colors
                    ${
                      action.variant === "primary"
                        ? `bg-blue-600 text-white hover:bg-blue-700`
                        : action.variant === "danger"
                        ? `bg-red-600 text-white hover:bg-red-700`
                        : `bg-white border ${colors.border} ${colors.text} hover:bg-gray-50`
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 닫기 버튼 */}
        {showCloseButton && onClose && (
          <button
            onClick={onClose}
            className={`
              ${colors.icon} hover:opacity-70 transition-opacity ml-2
            `}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// 인라인 에러 표시 (폼 필드 등에서 사용)
export function InlineErrorDisplay({
  error,
  className = "",
}: {
  error: AppError;
  className?: string;
}) {
  return (
    <ErrorDisplay
      error={error}
      compact={true}
      showCloseButton={false}
      className={`text-xs ${className}`}
    />
  );
}

// 성공 메시지 표시
export function SuccessDisplay({
  message,
  onClose,
  className = "",
}: {
  message: string;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`
        bg-green-50 border border-green-200 text-green-800
        rounded-lg p-4 ${className}
      `}
    >
      <div className="flex items-start">
        <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-green-600 hover:opacity-70 transition-opacity ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
