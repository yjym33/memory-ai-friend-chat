import React from "react";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "../ErrorBoundary";

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

// Mock console.error to avoid noise in test output
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render children when there is no error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("No error")).toBeInTheDocument();
  });

  it("should render error UI when child component throws", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
    expect(screen.getByText(/새로고침/)).toBeInTheDocument();
  });

  it("should show error details in development mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/오류 세부사항/)).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should hide error details in production mode", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText(/오류 세부사항/)).not.toBeInTheDocument();
    expect(screen.queryByText("Test error")).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should render custom fallback when provided", () => {
    const CustomFallback = ({ error }: { error: Error }) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error: Test error")).toBeInTheDocument();
  });

  it("should call onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it("should reset error state when children change", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error UI
    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();

    // Rerender with different children
    rerender(
      <ErrorBoundary>
        <div>New content</div>
      </ErrorBoundary>
    );

    // Should show new content, not error UI
    expect(screen.getByText("New content")).toBeInTheDocument();
    expect(screen.queryByText(/문제가 발생했습니다/)).not.toBeInTheDocument();
  });

  it("should handle errors in nested components", () => {
    const NestedComponent = () => {
      throw new Error("Nested error");
    };

    const WrapperComponent = () => (
      <div>
        <span>Wrapper</span>
        <NestedComponent />
      </div>
    );

    render(
      <ErrorBoundary>
        <WrapperComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
  });

  it("should handle async errors gracefully", async () => {
    const AsyncErrorComponent = () => {
      React.useEffect(() => {
        // Async errors are not caught by error boundaries
        // This test ensures the component doesn't break
        setTimeout(() => {
          // This won't be caught by ErrorBoundary
        }, 0);
      }, []);

      return <div>Async component</div>;
    };

    render(
      <ErrorBoundary>
        <AsyncErrorComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Async component")).toBeInTheDocument();
  });

  it("should handle multiple errors", () => {
    const MultiErrorComponent = ({ errorCount }: { errorCount: number }) => {
      if (errorCount > 0) {
        throw new Error(`Error ${errorCount}`);
      }
      return <div>No errors</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <MultiErrorComponent errorCount={0} />
      </ErrorBoundary>
    );

    expect(screen.getByText("No errors")).toBeInTheDocument();

    // First error
    rerender(
      <ErrorBoundary>
        <MultiErrorComponent errorCount={1} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
  });

  it("should preserve error boundary state across re-renders", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();

    // Re-render with same error component
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should still show error UI
    expect(screen.getByText(/문제가 발생했습니다/)).toBeInTheDocument();
  });

  it("should handle component stack traces", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show component stack in development
    expect(screen.getByText(/컴포넌트 스택/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it("should be accessible", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should have proper heading structure
    expect(screen.getByRole("heading")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
