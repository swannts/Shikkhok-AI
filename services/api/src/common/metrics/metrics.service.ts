import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: client.Registry;

  public readonly httpRequestDuration: client.Histogram<string>;
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly activeConnections: client.Gauge<string>;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register, prefix: 'shikkhok_api_' });

    this.httpRequestDuration = new client.Histogram({
      name: 'shikkhok_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    this.httpRequestsTotal = new client.Counter({
      name: 'shikkhok_http_requests_total',
      help: 'Total number of HTTP requests made',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.activeConnections = new client.Gauge({
      name: 'shikkhok_active_requests_total',
      help: 'Current number of active in-flight requests',
      registers: [this.register],
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
