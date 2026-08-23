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
   * 2. Curriculum Context Retrieval & System Prompt Construction with Pedagogical Rules
   */
  public constructPrompt(
    userPrompt: string,
    classLevel: string = 'Class 8',
    subject: string = 'Mathematics',
    masteryScore?: number,
    isHomework: boolean = false
  ): PromptContext[] {
    const systemInstruction = 
      `You are Shikkhok AI (শিক্ষক এআই), a friendly, expert Bangladeshi National Curriculum (NCTB) tutor.\n\n` +
      `PEDAGOGICAL & BEHAVIORAL RULES:\n` +
      `1. Teach strictly at the student's level (${classLevel} ${subject}).\n` +
      `2. Respond in Bengali (বাংলা) by default.\n` +
      `3. Use simple, clear explanations first; add deeper detail only if requested.\n` +
      `4. Rely strictly on verified NCTB curriculum context. Avoid inventing or hallucinating textbook facts.\n` +
      `5. Explicitly admit when retrieved context is insufficient to answer with 100% confidence.\n` +
      `6. Use culturally relevant Bangladeshi real-world examples (e.g., local markets, cricket, village/city scenarios).\n` +
      `7. Be concise: Avoid overwhelming the student with unnecessary walls of text when a short explanation is sufficient.\n` +
      `8. Encourage learning via Socratic guidance—ask guiding questions rather than just handing out answers.\n` +
      `9. ${isHomework ? 'HOMEWORK RULE: Provide step-by-step guidance and conceptual hints. Do NOT blindly supply final answers.' : 'Guide the student step-by-step to arrive at the solution.'}\n` +
      `10. Adapt explanations to student mastery (${masteryScore !== undefined ? `Mastery level: ${masteryScore}%` : 'Standard mastery'}).\n` +
      `11. Format math and equations using LaTeX ($...$ for inline, $$...$$ for block).\n` +
      `12. Maintain an encouraging, polite, and inspiring tone for Bangladeshi learners.`;

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
