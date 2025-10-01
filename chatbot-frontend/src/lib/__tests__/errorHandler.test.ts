import {
  ErrorHandler,
  BaseError,
  NetworkError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  ErrorCategory,
} from "../errorHandler";

// Mock toast functions
jest.mock("react-hot-toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
  },
}));

// Mock window and navigator
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockNavigator = {
  onLine: true,
};

Object.defineProperty(global, "window", {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, "navigator", {
  value: mockNavigator,
  writable: true,
});

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
    jest.clearAllMocks();
  });

  describe("Error Classes", () => {
    it("should create BaseError with correct properties", () => {
      const error = new BaseError(
        "Test message",
        ErrorCategory.VALIDATION,
        "TEST_CODE"
      );

      expect(error.message).toBe("Test message");
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe("TEST_CODE");
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.name).toBe("BaseError");
    });

    it("should create NetworkError with network category", () => {
      const error = new NetworkError("Network failed");

      expect(error.message).toBe("Network failed");
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.name).toBe("NetworkError");
    });

    it("should create ValidationError with validation category", () => {
      const error = new ValidationError("Invalid input");

      expect(error.message).toBe("Invalid input");
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.name).toBe("ValidationError");
    });

    it("should create AuthenticationError with auth category", () => {
      const error = new AuthenticationError("Login required");

      expect(error.message).toBe("Login required");
      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.name).toBe("AuthenticationError");
    });

    it("should create AuthorizationError with auth category", () => {
      const error = new AuthorizationError("Access denied");

      expect(error.message).toBe("Access denied");
      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.name).toBe("AuthorizationError");
    });

    it("should create ServerError with server category", () => {
      const error = new ServerError("Internal server error");

      expect(error.message).toBe("Internal server error");
      expect(error.category).toBe(ErrorCategory.SERVER);
      expect(error.name).toBe("ServerError");
    });
  });

  describe("Error Handling", () => {
    it("should handle BaseError correctly", () => {
      const error = new ValidationError("Invalid email format");
      const result = errorHandler.handle(error);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toBe("Invalid email format");
      expect(result.shouldRetry).toBe(false);
    });

    it("should handle network errors with retry option", () => {
      const error = new NetworkError("Connection timeout");
      const result = errorHandler.handle(error);

      expect(result.handled).toBe(true);
      expect(result.shouldRetry).toBe(true);
      expect(result.userMessage).toContain("네트워크");
    });

    it("should handle authentication errors", () => {
      const error = new AuthenticationError("Token expired");
      const result = errorHandler.handle(error);

      expect(result.handled).toBe(true);
      expect(result.shouldRetry).toBe(false);
      expect(result.userMessage).toContain("로그인");
    });

    it("should handle server errors", () => {
      const error = new ServerError("Database connection failed");
      const result = errorHandler.handle(error);

      expect(result.handled).toBe(true);
      expect(result.shouldRetry).toBe(true);
      expect(result.userMessage).toContain("서버");
    });

    it("should handle unknown errors", () => {
      const error = new Error("Unknown error");
      const result = errorHandler.handle(error);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toContain("예상치 못한");
    });

    it("should handle axios-like errors", () => {
      const axiosError = {
        response: {
          status: 404,
          data: { message: "Not found" },
        },
        message: "Request failed",
      };

      const result = errorHandler.handle(axiosError);

      expect(result.handled).toBe(true);
      expect(result.userMessage).toBe("Not found");
    });
  });

  describe("Error Recovery", () => {
    it("should suggest retry for network errors", () => {
      const error = new NetworkError("Connection failed");
      const result = errorHandler.handle(error);

      expect(result.shouldRetry).toBe(true);
      expect(result.retryDelay).toBeGreaterThan(0);
    });

    it("should not suggest retry for validation errors", () => {
      const error = new ValidationError("Invalid input");
      const result = errorHandler.handle(error);

      expect(result.shouldRetry).toBe(false);
    });

    it("should provide appropriate retry delay", () => {
      const error = new NetworkError("Timeout");
      const result = errorHandler.handle(error);

      expect(result.retryDelay).toBe(1000); // Default retry delay
    });
  });

  describe("Context Information", () => {
    it("should include context in error result", () => {
      const error = new ValidationError("Invalid data");
      const context = { userId: "123", action: "submit_form" };
      const result = errorHandler.handle(error, context);

      expect(result.context).toEqual(context);
    });

    it("should handle errors without context", () => {
      const error = new NetworkError("Connection failed");
      const result = errorHandler.handle(error);

      expect(result.context).toBeUndefined();
    });
  });
});
