import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const start = process.hrtime();
    this.metricsService.activeConnections.inc();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordMetrics(req, res, start);
        },
        error: () => {
          this.recordMetrics(req, res, start);
        },
      }),
    );
  }

  private recordMetrics(req: any, res: any, start: [number, number]) {
    this.metricsService.activeConnections.dec();
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    const route = req.route?.path || req.url || 'unknown';
    const method = req.method;
    const statusCode = String(res.statusCode || 200);

    this.metricsService.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      durationSeconds,
    );
    this.metricsService.httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });
  }
}
