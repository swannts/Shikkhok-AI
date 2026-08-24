import { Injectable, Logger } from '@nestjs/common';

export interface ModerationResult {
  isSafe: boolean;
  flaggedCategory?: string;
  safeResponseBn?: string;
}

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);

  // Toxic, violent, self-harm, or non-educational jailbreak patterns
  private readonly toxicPatterns: RegExp[] = [
    /\b(self[\s-]?harm|suicide|kill\s+myself|আত্মহত্যা|মরে\s+যাওয়া)\b/i,
    /\b(make\s+a\s+bomb|create\s+weapon|বোমা\s+বানানো|অস্ত্র\s+তৈরি)\b/i,
    /\b(porn|pornography|sex\s+video|যৌন|অশ্লীল)\b/i,
    /\b(ignore\s+all\s+previous\s+instructions|system\s+prompt\s+override)\b/i,
  ];

  moderatePrompt(prompt: string): ModerationResult {
    const text = prompt.trim();
    if (!text) {
      return { isSafe: true };
    }

    for (const pattern of this.toxicPatterns) {
      if (pattern.test(text)) {
        this.logger.warn(`Prompt moderation triggered for pattern: ${pattern.toString()}`);
        return {
          isSafe: false,
          flaggedCategory: 'SAFETY_POLICY_VIOLATION',
          safeResponseBn:
            'আমি দুঃখিত, আমি শুধুমাত্র বাংলাদেশ জাতীয় শিক্ষাক্রম (NCTB) ও লেখাপড়া সংক্রান্ত শিক্ষণীয় বিষয়ে সাহায্য করতে পারি। ক্ষতিকর বা নীতিবহির্ভূত কোনো বিষয়ে আমি উত্তর দিতে পারব না।',
        };
      }
    }

    return { isSafe: true };
  }
}
