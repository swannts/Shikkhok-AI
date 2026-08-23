import { aiCostControlManager } from '../cost/aiCostControl';

describe('AI Cost Control & Usage Observability Tests', () => {
  it('routes CLASSIFICATION tasks to ultra-cheap model (gemini-1.5-flash-8b)', () => {
    const route = aiCostControlManager.selectEconomicalModel('CLASSIFICATION');
    expect(route.model).toBe('gemini-1.5-flash-8b');
    expect(route.tier).toBe('ultra-cheap');
  });

  it('routes SIMPLE_EXPLANATION tasks to mid-tier model (gemini-1.5-flash)', () => {
    const route = aiCostControlManager.selectEconomicalModel('SIMPLE_EXPLANATION');
    expect(route.model).toBe('gemini-1.5-flash');
    expect(route.tier).toBe('mid-tier');
  });

  it('routes COMPLEX_TUTORING tasks to stronger model (gemini-1.5-pro)', () => {
    const route = aiCostControlManager.selectEconomicalModel('COMPLEX_TUTORING');
    expect(route.model).toBe('gemini-1.5-pro');
    expect(route.tier).toBe('stronger-model');
  });

  it('accurately tracks telemetry, token usage, input/output cost, and latency', () => {
    const telemetry = aiCostControlManager.calculateTelemetry(
      'student-101',
      'GeminiProvider',
      'gemini-1.5-flash',
      'SIMPLE_EXPLANATION',
      1000, // 1,000 input tokens
      500,  // 500 output tokens
      250   // 250ms latency
    );

    expect(telemetry.studentId).toBe('student-101');
    expect(telemetry.totalTokens).toBe(1500);
    expect(telemetry.estimatedCostUsd).toBeGreaterThan(0);
    expect(telemetry.latencyMs).toBe(250);
  });
});
