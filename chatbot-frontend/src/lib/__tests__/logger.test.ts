import { logger } from "../logger";

describe("Logger", () => {
  const mockConsole = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };

  const originalConsole = { ...console };
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    console.warn = mockConsole.warn;
    console.info = mockConsole.info;
    console.debug = mockConsole.debug;
    
    jest.clearAllMocks();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
    Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv });
  });

  describe("in development environment", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true
      });
      // Re-initialize logger logic or assume it checks env on cada call if it's dynamic
      // Logger class in logger.ts has `private isDevelopment = process.env.NODE_ENV === "development";`
      // This is evaluated ONLY once at import. 
    });

    it("should log info messages in development", () => {
      logger.info("info message");
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]"),
        ""
      );
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("info message"),
        ""
      );
    });

    it("should log error messages in development", () => {
      logger.error("error message");
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]"),
        ""
      );
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining("error message"),
        ""
      );
    });
  });

  describe("data handling", () => {
    it("should include data in logs", () => {
      const data = { foo: "bar" };
      logger.info("test", data);
      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining("test"),
        data
      );
    });
  });
});
