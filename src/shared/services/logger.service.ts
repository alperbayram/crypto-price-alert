import fs from "fs";
import path from "path";

class LoggerService {
  private logDir: string;

  constructor() {
    this.logDir = path.join(__dirname, "../../../logs");
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private formatLog(level: string, message: string, data?: any): string {
    return (
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        data,
      }) + "\n"
    );
  }

  error(message: string, error?: any) {
    const logEntry = this.formatLog("ERROR", message, {
      error: error?.message || error,
      stack: error?.stack,
    });
    fs.appendFileSync(path.join(this.logDir, "error.log"), logEntry);
    console.error(message, error);
  }

  info(message: string, data?: any) {
    const logEntry = this.formatLog("INFO", message, data);
    fs.appendFileSync(path.join(this.logDir, "info.log"), logEntry);
    console.log(message, data);
  }

  warn(message: string, data?: any) {
    const logEntry = this.formatLog("WARN", message, data);
    fs.appendFileSync(path.join(this.logDir, "warn.log"), logEntry);
    console.warn(message, data);
  }
}

export const logger = new LoggerService();
