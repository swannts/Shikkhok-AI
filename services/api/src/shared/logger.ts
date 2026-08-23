export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface StructuredLogContext {
  timestamp?: string;
  level?: LogLevel;
  service: string;
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  status?: number;
  duration?: number;
  errorCode?: string;
  message?: string;
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'otp',
  'otphash',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'apikey',
  'secret',
];

export class StructuredLogger {
  constructor(private defaultService: string = 'shikkhok-api') {}

  /**
   * Sanitizes objects by redacting sensitive keys (passwords, OTPs, tokens, keys)
   */
  public sanitize(data: Record<string, any>): Record<string, any> {
    if (!data || typeof data !== 'object') return data;

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitiveKey) => lowerKey.includes(sensitiveKey))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  public log(level: LogLevel, context: StructuredLogContext) {
    const sanitizedContext = this.sanitize(context);
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.defaultService,
      ...sanitizedContext,
    };

    const formattedLog = JSON.stringify(entry);

    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'info':
      default:
        console.log(formattedLog);
        break;
    }
  }

  public info(context: StructuredLogContext) {
    this.log('info', context);
  }

  public warn(context: StructuredLogContext) {
    this.log('warn', context);
  }

  public error(context: StructuredLogContext) {
    this.log('error', context);
  }
}

export const logger = new StructuredLogger();
