import 'reflect-metadata';
import { AiMetricsService } from '../services/ai-metrics.service';
import { SafetyCategory } from '../enums/safety-category.enum';

describe('AiMetricsService', () => {
  let service: AiMetricsService;

  beforeEach(() => {
    service = new AiMetricsService();
  });

  it('should record AI requests and latencies', () => {
    service.recordRequest('gemini');
    service.recordRequest('gemini');
    service.recordLatency(100);
    service.recordLatency(200);

    const summary = service.getMetricsSummary();
    expect(summary.requestsTotal['gemini']).toBe(2);
    expect(summary.averageLatencyMs).toBe(150);
  });

  it('should record moderation blocks without prompt text', () => {
    service.recordModerationBlock(SafetyCategory.SELF_HARM);
    service.recordModerationBlock(SafetyCategory.JAILBREAK);

    const summary = service.getMetricsSummary();
    expect(summary.moderationBlocks[SafetyCategory.SELF_HARM]).toBe(1);
    expect(summary.moderationBlocks[SafetyCategory.JAILBREAK]).toBe(1);

    const prometheus = service.toPrometheusMetrics();
    expect(prometheus.some((l) => l.includes('category="SELF_HARM"'))).toBe(true);
    expect(prometheus.some((l) => l.includes('category="JAILBREAK"'))).toBe(true);
  });
});
