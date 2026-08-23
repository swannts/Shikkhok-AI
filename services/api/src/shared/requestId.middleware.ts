import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface RequestWithId extends Request {
  requestId?: string;
}

export const requestIdMiddleware = (req: RequestWithId, res: Response, next: NextFunction) => {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || `req-${crypto.randomUUID()}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
