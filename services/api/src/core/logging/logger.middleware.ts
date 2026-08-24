import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLoggerService } from './logging.service';

@Injectable()
export class HTTPLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const requestId = (req.headers['x-request-id'] as string) || (req as any).requestId;

    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const { statusCode } = res;

      this.logger.log(`HTTP ${method} ${originalUrl} ${statusCode}`, 'HTTP', {
        requestId,
        method,
        route: originalUrl,
        statusCode,
        durationMs,
      });
    });

    next();
  }
}
