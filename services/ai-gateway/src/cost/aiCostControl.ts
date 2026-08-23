export type AiRequestType = 'CLASSIFICATION' | 'SIMPLE_EXPLANATION' | 'COMPLEX_TUTORING';

export interface AiUsageTelemetry {
  studentId: string;
  provider: string;              // e.g. 'GeminiProvider', 'OpenAIProvider'
  model: string;                 // e.g. 'gemini-1.5-flash-8b', 'gemini-1.5-flash', 'gemini-1.5-pro'
  requestType: AiRequestType;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  latencyMs: number;
  timestamp: Date;
}

export class AiCostControlManager {
  /**
   * Cost Tier Pricing Table per 1M Tokens (Gemini / OpenAI standards)
   */
  private readonly PRICING_PER_1M_TOKENS = {
    'gemini-1.5-flash-8b': { input: 0.0375, output: 0.15 },  // Ultra Cheap Model
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },     // Mid-Tier Model
    'gemini-1.5-pro': { input: 1.25, output: 5.00 },        // Stronger Tutoring Model
  };

  /**
   * 1. Cost-Optimized Model Routing Matrix
   * Matches request complexity to the most economical AI model:
   * - CLASSIFICATION -> Ultra cheap model (gemini-1.5-flash-8b)
   * - SIMPLE_EXPLANATION -> Mid-tier model (gemini-1.5-flash)
   * - COMPLEX_TUTORING -> Stronger model (gemini-1.5-pro)
   */
  public selectEconomicalModel(requestType: AiRequestType): { model: string; tier: string } {
    switch (requestType) {
      case 'CLASSIFICATION':
        return { model: 'gemini-1.5-flash-8b', tier: 'ultra-cheap' };
      case 'SIMPLE_EXPLANATION':
        return { model: 'gemini-1.5-flash', tier: 'mid-tier' };
      case 'COMPLEX_TUTORING':
      default:
        return { model: 'gemini-1.5-pro', tier: 'stronger-model' };
    }
  }

  /**
   * 2. Usage & Cost Observability Accounting
   */
  public calculateTelemetry(
    studentId: string,
    provider: string,
    model: string,
    requestType: AiRequestType,
    inputTokens: number,
    outputTokens: number,
    latencyMs: number
  ): AiUsageTelemetry {
    const totalTokens = inputTokens + outputTokens;
    const rates = (this.PRICING_PER_1M_TOKENS as any)[model] || { input: 0.075, output: 0.30 };

    const inputCost = (inputTokens / 1_000_000) * rates.input;
    const outputCost = (outputTokens / 1_000_000) * rates.output;
    const estimatedCostUsd = parseFloat((inputCost + outputCost).toFixed(6));

    return {
      studentId,
      provider,
      model,
      requestType,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCostUsd,
      latencyMs,
      timestamp: new Date(),
    };
  }
}

export const aiCostControlManager = new AiCostControlManager();
