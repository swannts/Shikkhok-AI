import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

export interface LogPayload {
  requestId?: string;
  module?: string;
  operation?: string;
  durationMs?: number;
  statusCode?: number;
  [key: string]: any;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private formatMessage(
    level: string,
    message: any,
    context?: string,
    payload?: LogPayload,
  ): string {
    const timestamp = new Date().toISOString();
    const sanitizedPayload = { ...payload };

    // Security rule: Never log sensitive authentication or payment fields
    if (sanitizedPayload.password) delete sanitizedPayload.password;
    if (sanitizedPayload.passwordHash) delete sanitizedPayload.passwordHash;
    if (sanitizedPayload.otp) delete sanitizedPayload.otp;
    if (sanitizedPayload.token) delete sanitizedPayload.token;
    if (sanitizedPayload.accessToken) delete sanitizedPayload.accessToken;
    if (sanitizedPayload.refreshToken) delete sanitizedPayload.refreshToken;

    return JSON.stringify({
      timestamp,
      level,
      context: context || 'App',
      message,
      ...sanitizedPayload,
    });
  }

  log(message: any, context?: string, payload?: LogPayload) {
    console.log(this.formatMessage('info', message, context, payload));
  }

  error(message: any, trace?: string, context?: string, payload?: LogPayload) {
    console.error(this.formatMessage('error', message, context, { ...payload, trace }));
  }

  warn(message: any, context?: string, payload?: LogPayload) {
    console.warn(this.formatMessage('warn', message, context, payload));
  }

  debug(message: any, context?: string, payload?: LogPayload) {
    console.debug(this.formatMessage('debug', message, context, payload));
  }
}
