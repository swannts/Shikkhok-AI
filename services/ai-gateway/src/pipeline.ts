import { Request, Response, NextFunction } from 'express';

export interface PromptContext {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AiGatewayPipeline {
  /**
   * 1. Safety Check: Filter forbidden/unsafe inputs
   */
  public performSafetyCheck(prompt: string): { safe: boolean; reason?: string } {
    const forbiddenPatterns = [/harmful_content_pattern/i];
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(prompt)) {
        return { safe: false, reason: 'Content flagged by safety filter.' };
      }
    }
    return { safe: true };
  }

  /**
   * 2. Curriculum Context Retrieval & System Prompt Construction
   */
  public constructPrompt(userPrompt: string, classLevel: string = 'Class 8', subject: string = 'Mathematics'): PromptContext[] {
    const systemInstruction = 
      `You are Shikkhok AI (শিক্ষক এআই), a friendly, expert Bangladeshi National Curriculum tutor for ${classLevel} ${subject}.\n` +
      `Guidelines:\n` +
      `- Respond clearly in Bengali (বাংলা).\n` +
      `- Use step-by-step Socratic guidance without giving direct answers immediately.\n` +
      `- Use LaTeX notation for mathematical equations ($...$ or $$...$$).`;

    return [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt },
    ];
  }

  /**
   * 3. Intelligent Model Routing & Fallback
   */
  public routeModel(requestedModel?: string): { primaryModel: string; fallbackModel: string } {
    if (requestedModel === 'gemini-1.5-pro') {
      return { primaryModel: 'gemini-1.5-pro', fallbackModel: 'gemini-1.5-flash' };
    }
    return { primaryModel: 'gemini-1.5-flash', fallbackModel: 'gemini-1.5-flash-8b' };
  }

  /**
   * 4. Usage Accounting & Cost Tracking
   */
  public calculateUsage(promptText: string, completionText: string) {
    const estimatedPromptTokens = Math.ceil(promptText.length / 4);
    const estimatedCompletionTokens = Math.ceil(completionText.length / 4);
    const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Approximate cost: $0.000075 / 1k tokens for Gemini Flash
    const estimatedCostUsd = (totalTokens / 1000) * 0.000075;

    return {
      promptTokens: estimatedPromptTokens,
      completionTokens: estimatedCompletionTokens,
      totalTokens,
      estimatedCostUsd: parseFloat(estimatedCostUsd.toFixed(6)),
    };
  }
}

export const aiGatewayPipeline = new AiGatewayPipeline();
