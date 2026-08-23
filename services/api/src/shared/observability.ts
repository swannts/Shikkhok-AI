export interface SystemMetrics {
  apiLatencyMs: number;
  errorRatePercentage: number;
  databaseLatencyMs: number;
  aiLatencyMs: number;
  aiProviderErrorsCount: number;
  tokenUsageTotal: number;
  aiCostEstUsd: number;
  sseDisconnectRatePercentage: number;
  queueDepth: number;
  jobFailuresCount: number;
  authFailuresCount: number;
}

export class ObservabilityRegistry {
  private metrics: SystemMetrics = {
    apiLatencyMs: 0,
    errorRatePercentage: 0,
    databaseLatencyMs: 0,
    aiLatencyMs: 0,
    aiProviderErrorsCount: 0,
    tokenUsageTotal: 0,
    aiCostEstUsd: 0,
    sseDisconnectRatePercentage: 0,
    queueDepth: 0,
    jobFailuresCount: 0,
    authFailuresCount: 0,
  };

  public recordApiRequest(durationMs: number, isError: boolean) {
    this.metrics.apiLatencyMs = Math.round((this.metrics.apiLatencyMs + durationMs) / 2);
    if (isError) {
      this.metrics.errorRatePercentage = Math.min(100, this.metrics.errorRatePercentage + 1);
    }
  }

  public recordAiMetrics(tokens: number, costUsd: number, durationMs: number, isProviderError: boolean) {
    this.metrics.tokenUsageTotal += tokens;
    this.metrics.aiCostEstUsd = parseFloat((this.metrics.aiCostEstUsd + costUsd).toFixed(6));
    this.metrics.aiLatencyMs = Math.round((this.metrics.aiLatencyMs + durationMs) / 2);
    if (isProviderError) {
      this.metrics.aiProviderErrorsCount += 1;
    }
  }

  public recordAuthFailure() {
    this.metrics.authFailuresCount += 1;
  }

  public recordJobFailure() {
    this.metrics.jobFailuresCount += 1;
  }

  public getPrometheusMetrics(): string {
    return `# HELP shikkhok_api_latency_ms Average API Latency in Milliseconds
# TYPE shikkhok_api_latency_ms gauge
shikkhok_api_latency_ms ${this.metrics.apiLatencyMs}

# HELP shikkhok_ai_token_usage_total Total AI Tokens Consumed
# TYPE shikkhok_ai_token_usage_total counter
shikkhok_ai_token_usage_total ${this.metrics.tokenUsageTotal}

# HELP shikkhok_ai_cost_usd_total Estimated AI Cost in USD
# TYPE shikkhok_ai_cost_usd_total counter
shikkhok_ai_cost_usd_total ${this.metrics.aiCostEstUsd}

# HELP shikkhok_ai_provider_errors_total Total AI Provider Failures
# TYPE shikkhok_ai_provider_errors_total counter
shikkhok_ai_provider_errors_total ${this.metrics.aiProviderErrorsCount}

# HELP shikkhok_auth_failures_total Total Authentication Failures
# TYPE shikkhok_auth_failures_total counter
shikkhok_auth_failures_total ${this.metrics.authFailuresCount}
`;
  }

  public getMetricsSummary(): SystemMetrics {
    return { ...this.metrics };
  }
}

export const observabilityRegistry = new ObservabilityRegistry();
