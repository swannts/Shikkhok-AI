import { Injectable } from '@nestjs/common';
import { SafetyCategory } from '../enums/safety-category.enum';

@Injectable()
export class AiMetricsService {
  private requestsTotal: Record<string, number> = {};
  private failuresTotal: Record<string, number> = {};
  private fallbackTotal: Record<string, number> = {};
  private moderationBlockTotal: Record<SafetyCategory, number> = {
    [SafetyCategory.SAFE_EDUCATIONAL]: 0,
    [SafetyCategory.SELF_HARM]: 0,
    [SafetyCategory.VIOLENCE]: 0,
    [SafetyCategory.WEAPONS]: 0,
    [SafetyCategory.SEXUAL_CONTENT]: 0,
    [SafetyCategory.BULLYING]: 0,
    [SafetyCategory.HATE]: 0,
    [SafetyCategory.ILLEGAL_ACTIVITY]: 0,
    [SafetyCategory.JAILBREAK]: 0,
    [SafetyCategory.PERSONAL_DATA]: 0,
    [SafetyCategory.GENERAL_WELLBEING]: 0,
  };
  private totalLatencyMs = 0;
  private latencyCount = 0;

  recordRequest(provider = 'gemini'): void {
    this.requestsTotal[provider] = (this.requestsTotal[provider] || 0) + 1;
  }

  recordFailure(provider = 'gemini', errorType = 'unknown'): void {
    const key = `${provider}_${errorType}`;
    this.failuresTotal[key] = (this.failuresTotal[key] || 0) + 1;
  }

  recordFallback(reason = 'timeout'): void {
    this.fallbackTotal[reason] = (this.fallbackTotal[reason] || 0) + 1;
  }

  recordModerationBlock(category: SafetyCategory): void {
    this.moderationBlockTotal[category] = (this.moderationBlockTotal[category] || 0) + 1;
  }

  recordLatency(ms: number): void {
    this.totalLatencyMs += ms;
    this.latencyCount += 1;
  }

  getMetricsSummary(): {
    requestsTotal: Record<string, number>;
    failuresTotal: Record<string, number>;
    fallbackTotal: Record<string, number>;
    moderationBlocks: Record<string, number>;
    averageLatencyMs: number;
  } {
    return {
      requestsTotal: { ...this.requestsTotal },
      failuresTotal: { ...this.failuresTotal },
      fallbackTotal: { ...this.fallbackTotal },
      moderationBlocks: { ...this.moderationBlockTotal },
      averageLatencyMs:
        this.latencyCount > 0 ? Math.round(this.totalLatencyMs / this.latencyCount) : 0,
    };
  }

  toPrometheusMetrics(): string[] {
    const lines: string[] = [
      '# HELP shikkhok_ai_requests_total Total number of AI generation requests',
      '# TYPE shikkhok_ai_requests_total counter',
    ];

    for (const [provider, count] of Object.entries(this.requestsTotal)) {
      lines.push(`shikkhok_ai_requests_total{provider="${provider}"} ${count}`);
    }

    lines.push(
      '# HELP shikkhok_ai_moderation_block_total Total safety moderation blocks by category (no raw prompts)',
      '# TYPE shikkhok_ai_moderation_block_total counter',
    );
    for (const [category, count] of Object.entries(this.moderationBlockTotal)) {
      if (count > 0) {
        lines.push(`shikkhok_ai_moderation_block_total{category="${category}"} ${count}`);
      }
    }

    return lines;
  }
}
