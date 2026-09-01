import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: client.Registry;

  public readonly httpRequestDuration: client.Histogram<string>;
  public readonly httpRequestsTotal: client.Counter<string>;
  public readonly activeConnections: client.Gauge<string>;
  public readonly activeWebSocketConnections: client.Gauge<string>;
  public readonly activeClassrooms: client.Gauge<string>;
  public readonly websocketChatMessages: client.Counter<string>;
  public readonly websocketQuizEvents: client.Counter<string>;
  public readonly websocketWhiteboardStrokes: client.Counter<string>;
  public readonly websocketDisconnects: client.Counter<string>;

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

    this.activeWebSocketConnections = new client.Gauge({
      name: 'shikkhok_active_websocket_connections',
      help: 'Current number of connected live classroom WebSocket sockets',
      registers: [this.register],
    });

    this.activeClassrooms = new client.Gauge({
      name: 'shikkhok_active_classrooms',
      help: 'Current number of active live classroom rooms',
      registers: [this.register],
    });

    this.websocketChatMessages = new client.Counter({
      name: 'shikkhok_websocket_chat_messages_total',
      help: 'Total number of chat messages sent in live classrooms',
      labelNames: ['classroom_id'],
      registers: [this.register],
    });

    this.websocketQuizEvents = new client.Counter({
      name: 'shikkhok_websocket_quiz_events_total',
      help: 'Total number of quiz events in live classrooms',
      labelNames: ['event_type'],
      registers: [this.register],
    });

    this.websocketWhiteboardStrokes = new client.Counter({
      name: 'shikkhok_websocket_whiteboard_strokes_total',
      help: 'Total number of whiteboard strokes in live classrooms',
      labelNames: ['classroom_id'],
      registers: [this.register],
    });

    this.websocketDisconnects = new client.Counter({
      name: 'shikkhok_websocket_disconnects_total',
      help: 'Total number of WebSocket disconnects from live classrooms',
      labelNames: ['reason'],
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
