import { errorHandler } from "../errorHandler";
import { 
  ErrorCategory, 
  ErrorSeverity, 
  ValidationError, 
  NetworkError 
} from "../../types/error";

// Mock toast and logger
jest.mock("../../lib/toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock("../../lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("ErrorHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleError", () => {
    it("should handle error and show toast by default", () => {
      const error = {
        id: "test-id",
        message: "Test error",
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        timestamp: new Date(),
        name: "ValidationError"
      } as any;

      errorHandler.handleError(error);
      
      const { error: toastError } = require("../../lib/toast");
      expect(toastError).toHaveBeenCalled();
    });

    it("should NOT show toast if showToast option is false", () => {
      const error = {
        message: "Hidden error",
        category: ErrorCategory.SYSTEM,
        severity: ErrorSeverity.LOW,
      } as any;

      errorHandler.handleError(error, { showToast: false });
      
      const { error: toastError } = require("../../lib/toast");
      expect(toastError).not.toHaveBeenCalled();
    });
  });

  describe("createUiError", () => {
    it("should create a UI error with correct category", () => {
      const error = errorHandler.createUiError("UI failed", "ComponentA");
      expect(error.category).toBe(ErrorCategory.UI);
      expect(error.message).toBe("UI failed");
    });
  });
});
