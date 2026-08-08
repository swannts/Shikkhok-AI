class LoggerService {
  public info(message: string, context?: Record<string, unknown>): void {
    if (__DEV__) {
      console.log(`[INFO] ${message}`, context || '');
    }
  }

  public warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, context || '');
  }

  public error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, error || '', context || '');
  }
}

export const logger = new LoggerService();
