type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
}

class Logger {
  private get isDevelopment() {
    return process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // 프로덕션에서는 error만 로그
    if (!this.isDevelopment) {
      return level === "error";
    }
    return true;
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      const entry = this.formatMessage("info", message, data);
      console.log(`[INFO] ${entry.timestamp} - ${message}`, data || "");
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      const entry = this.formatMessage("warn", message, data);
      console.warn(`[WARN] ${entry.timestamp} - ${message}`, data || "");
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog("error")) {
      const entry = this.formatMessage("error", message, error);
      console.error(`[ERROR] ${entry.timestamp} - ${message}`, error || "");
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      const entry = this.formatMessage("debug", message, data);
      console.debug(`[DEBUG] ${entry.timestamp} - ${message}`, data || "");
    }
  }
}

export const logger = new Logger();
export default logger;
