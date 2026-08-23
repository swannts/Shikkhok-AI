import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import authRoutes from './modules/auth/auth.routes';
import curriculumRoutes from './modules/curriculum/curriculum.routes';
import progressRoutes from './modules/progress/progress.routes';
import practiceRoutes from './routes/practice';
import studyPlanRoutes from './routes/studyPlan';
import homeworkRoutes from './routes/homework';

import { requestIdMiddleware, RequestWithId } from './shared/requestId.middleware';

import { securityHeadersMiddleware } from './shared/securityHeaders.middleware';

import { logger } from './shared/logger';
import { observabilityRegistry } from './shared/observability';

const app = express();
const PORT = process.env.PORT || 4000;

// Production Explicit CORS Allowlist
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:8081'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('CORS_NOT_ALLOWED'));
      }
    },
    credentials: true,
  })
);

app.use(securityHeadersMiddleware);
app.use(express.json());
app.use(requestIdMiddleware);

// Structured HTTP Request Logging Middleware
app.use((req: RequestWithId, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      service: 'shikkhok-api',
      requestId: req.requestId,
      userId: (req as any).user?.userId,
      route: req.originalUrl || req.url,
      method: req.method,
      status: res.statusCode,
      duration,
    });
  });
  next();
});

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Shikkhok AI Main API', timestamp: new Date() });
});

// Prometheus & OpenTelemetry Metrics Endpoint
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(observabilityRegistry.getPrometheusMetrics());
});

// Modular Monolith Domain API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/curriculum', curriculumRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/practice', practiceRoutes);
app.use('/api/v1/study-plan', studyPlanRoutes);
app.use('/api/v1/homework', homeworkRoutes);

// Structured Global Error Handler enforcing strict Error Contract & Zero Leakage
app.use((err: any, req: RequestWithId, res: express.Response, next: express.NextFunction) => {
  const requestId = req.requestId || 'req-unknown';
  const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';

  if (err instanceof ZodError) {
    logger.warn({
      service: 'shikkhok-api',
      requestId,
      route: req.originalUrl,
      method: req.method,
      status: 400,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid request data',
    });
    return res.status(400).json({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      banglaMessage: 'প্রদত্ত তথ্য সঠিক নয়।',
      details: err.flatten().fieldErrors,
      requestId,
    });
  }

  const statusCode = err.statusCode || 500;
  const errorCode = err.errorCode || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  
  let message = err.message || 'An unexpected error occurred';
  let details = err.details || undefined;

  if (isProduction && (statusCode === 500 || err.code || err.sqlState)) {
    message = 'An internal server error occurred';
    details = undefined;
  }

  const banglaMessage = err.banglaMessage || 'একটি কারিগরি ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';

  if (statusCode === 500) {
    logger.error({
      service: 'shikkhok-api',
      requestId,
      route: req.originalUrl,
      method: req.method,
      status: 500,
      errorCode,
      message: err.message,
    });
  }

  res.status(statusCode).json({
    statusCode,
    errorCode,
    message,
    banglaMessage,
    details,
    requestId,
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Shikkhok AI Main API running on http://localhost:${PORT}`);
});
