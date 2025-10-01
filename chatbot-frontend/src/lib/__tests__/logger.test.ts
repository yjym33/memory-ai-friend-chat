import { logger } from "../logger";

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

describe("Logger", () => {
  beforeEach(() => {
    // Replace console methods with mocks
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    console.warn = mockConsole.warn;
    console.info = mockConsole.info;
    console.debug = mockConsole.debug;

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
  });

  describe("in development environment", () => {
    beforeEach(() => {
      // Mock development environment
      process.env.NODE_ENV = "development";
    });

    it("should log messages in development", () => {
      logger.log("test message");
      expect(mockConsole.log).toHaveBeenCalledWith("test message");
    });

    it("should log error messages in development", () => {
      logger.error("error message");
      expect(mockConsole.error).toHaveBeenCalledWith("error message");
    });

    it("should log warning messages in development", () => {
      logger.warn("warning message");
      expect(mockConsole.warn).toHaveBeenCalledWith("warning message");
    });

    it("should log info messages in development", () => {
      logger.info("info message");
      expect(mockConsole.info).toHaveBeenCalledWith("info message");
    });

    it("should log debug messages in development", () => {
      logger.debug("debug message");
      expect(mockConsole.debug).toHaveBeenCalledWith("debug message");
    });
  });

  describe("in production environment", () => {
    beforeEach(() => {
      // Mock production environment
      process.env.NODE_ENV = "production";
    });

    it("should not log regular messages in production", () => {
      logger.log("test message");
      expect(mockConsole.log).not.toHaveBeenCalled();
    });

    it("should still log error messages in production", () => {
      logger.error("error message");
      expect(mockConsole.error).toHaveBeenCalledWith("error message");
    });

    it("should not log warning messages in production", () => {
      logger.warn("warning message");
      expect(mockConsole.warn).not.toHaveBeenCalled();
    });

    it("should not log info messages in production", () => {
      logger.info("info message");
      expect(mockConsole.info).not.toHaveBeenCalled();
    });

    it("should not log debug messages in production", () => {
      logger.debug("debug message");
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe("with multiple arguments", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
    });

    it("should handle multiple arguments", () => {
      logger.log("message", { data: "test" }, 123);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "message",
        { data: "test" },
        123
      );
    });

    it("should handle objects and arrays", () => {
      const testObj = { key: "value" };
      const testArr = [1, 2, 3];
      logger.info("Test:", testObj, testArr);
      expect(mockConsole.info).toHaveBeenCalledWith("Test:", testObj, testArr);
    });
  });
});
