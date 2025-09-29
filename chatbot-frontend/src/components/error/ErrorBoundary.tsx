"use client";

import React from "react";
import { ErrorInfo, ReactNode } from "react";
import { errorHandler } from "../../lib/errorHandler";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 핸들러를 통해 처리
    const appError = errorHandler.createUiError(
      `React Error Boundary: ${error.message}`,
      "ErrorBoundary",
      {
        context: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true,
        },
        stackTrace: error.stack,
      }
    );

    errorHandler.handleError(appError, {
      showToast: false, // Error Boundary UI로 대체
      reportToService: true,
    });

    this.setState({ errorId: appError.id });

    // 부모 컴포넌트에 알림
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 사용자 정의 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              앗! 문제가 발생했습니다
            </h1>

            <p className="text-gray-600 mb-6">
              화면을 표시하는 중 오류가 발생했습니다.
              <br />
              잠시 후 다시 시도해주세요.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-left text-sm">
                <details>
                  <summary className="cursor-pointer font-medium">
                    개발자 정보
                  </summary>
                  <div className="mt-2 text-xs text-gray-700">
                    <p>
                      <strong>에러 ID:</strong> {this.state.errorId}
                    </p>
                    <p>
                      <strong>메시지:</strong> {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="mt-2 overflow-auto max-h-32 text-xs">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>

              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 함수형 컴포넌트 래퍼
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
