import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId || (request.headers['x-request-id'] as string) || '';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'An unexpected internal server error occurred';
    let details: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        message = resObj.message || message;
        details = resObj.error || resObj.details || {};
        
        if (Array.isArray(resObj.message)) {
          errorCode = 'VALIDATION_ERROR';
          message = 'Validation failed for incoming request';
          details = { validationErrors: resObj.message };
        }
      }

      switch (status) {
        case HttpStatus.BAD_REQUEST:
          if (errorCode !== 'VALIDATION_ERROR') errorCode = 'BAD_REQUEST';
          break;
        case HttpStatus.UNAUTHORIZED:
          errorCode = 'UNAUTHORIZED';
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = 'FORBIDDEN';
          break;
        case HttpStatus.NOT_FOUND:
          errorCode = 'NOT_FOUND';
          break;
        case HttpStatus.CONFLICT:
          errorCode = 'CONFLICT';
          break;
        case HttpStatus.TOO_MANY_REQUESTS:
          errorCode = 'RATE_LIMITED';
          break;
      }
    } else if (exception && typeof exception === 'object' && 'name' in exception) {
      const errName = (exception as any).name;

      // Handle MongoDB Duplicate Key (E11000)
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        errorCode = 'CONFLICT';
        message = 'A resource with the specified unique field already exists';
        details = { keyPattern: (exception as any).keyPattern };
      } else if (errName === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
        message = 'Mongoose document validation failed';
        details = (exception as any).errors || {};
      }
    }

    // Log unhandled non-http internal errors safely without leaking DB credentials to client
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        (exception as any)?.stack,
      );
    }

    response.status(status).json({
      error: {
        code: errorCode,
        message,
        details: process.env.NODE_ENV === 'production' ? {} : details,
      },
      requestId,
    });
  }
}
