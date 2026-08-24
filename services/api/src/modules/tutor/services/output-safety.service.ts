import { Injectable, Logger } from '@nestjs/common';
import { SafetyCategory } from '../enums/safety-category.enum';

export interface OutputSafetyResult {
  isSafe: boolean;
  sanitizedContent: string;
  category: SafetyCategory;
  reason?: string;
}

@Injectable()
export class OutputSafetyService {
  private readonly logger = new Logger(OutputSafetyService.name);

  validateOutput(outputContent: string): OutputSafetyResult {
    if (!outputContent || !outputContent.trim()) {
      return {
        isSafe: true,
        sanitizedContent: outputContent || '',
        category: SafetyCategory.SAFE_EDUCATIONAL,
      };
    }

    const text = outputContent.trim();

    // 1. Check for system key / prompt leakage
    if (
      /\b(ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY|system\s+instruction:|developer_mode)\b/i.test(
        text,
      )
    ) {
      this.logger.error('Security alert: AI output attempted prompt/credential leakage');
      return {
        isSafe: false,
        category: SafetyCategory.JAILBREAK,
        sanitizedContent:
          'উত্তরটি প্রক্রিয়া করতে সমস্যা হয়েছে। অনুগ্রহ করে তোমার প্রশ্নটি পুনরায় জিজ্ঞাসা করো।',
        reason: 'Sensitive instruction or key leakage prevented',
      };
    }

    // 2. Check for actionable harm in output
    if (
      /\b(step[- ]by[- ]step\s+to\s+(kill|harm|commit\s+suicide)|how\s+to\s+detonate|bomb\s+recipe)\b/i.test(
        text,
      )
    ) {
      this.logger.error('Security alert: AI generated unsafe harmful instructions in output');
      return {
        isSafe: false,
        category: SafetyCategory.WEAPONS,
        sanitizedContent:
          'পাঠ্যসূচি বহির্ভূত অনিরাপদ তথ্য পরিহার করা হয়েছে। জাতীয় শিক্ষাক্রমের বিষয়ভিত্তিক আলোচনা করতে প্রশ্ন করো।',
        reason: 'Actionable dangerous content in AI response',
      };
    }

    // 3. Prevent hallucinated unverified external phone numbers
    // Allows standard national emergency (999/৯৯৯) or verified hotlines, but scrubs random phone numbers
    const sanitized = text.replace(
      /(?<!999|৯৯৯|\b109|\b১০৯|\b1098|\b১০৯৮|\b333|\b৩৩৩)(\+?8801[3-9]\d{8}|01[3-9]\d{8}|(\+?৮৮)?০১[৩-৯][০-৯]{8})/g,
      '[নম্বর পরিহার করা হয়েছে]',
    );

    return {
      isSafe: true,
      sanitizedContent: sanitized,
      category: SafetyCategory.SAFE_EDUCATIONAL,
    };
  }
}
