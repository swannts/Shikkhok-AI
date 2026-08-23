import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface RequestWithCorrelationId extends Request {
  requestId?: string;
  correlationId?: string;
}

export const correlationIdMiddleware = (req: RequestWithCorrelationId, res: Response, next: NextFunction) => {
  const existingCorrelationId = (req.headers['x-correlation-id'] || req.headers['x-request-id']) as string;
  const correlationId = existingCorrelationId || `req-${crypto.randomUUID()}`;

  req.correlationId = correlationId;
  req.requestId = correlationId;

  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', correlationId);

  next();
};
