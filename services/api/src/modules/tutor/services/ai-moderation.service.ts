import { Injectable, Logger } from '@nestjs/common';
import { SafetyCategory } from '../enums/safety-category.enum';

export interface ModerationResult {
  isSafe: boolean;
  category: SafetyCategory;
  safeResponseBn?: string;
  reason?: string;
}

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);

  // Layer 1: Text Normalization
  normalizeText(input: string): string {
    if (!input) return '';
    return input
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // remove zero-width characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Layer 2 & 3: Context-Aware Multi-Layer Rule Moderation
  moderatePrompt(prompt: string): ModerationResult {
    const normalized = this.normalizeText(prompt);
    if (!normalized) {
      return { isSafe: true, category: SafetyCategory.SAFE_EDUCATIONAL };
    }

    // 1. Self-Harm & Suicide Detection (Actionable vs Educational Prevention)
    const isEducationalSelfHarm =
      /\b(prevention|prevent|awareness|importance\s+of\s+mental\s+health|প্রতিরোধ|সচেতনতা|মানসিক\s+স্বাস্থ্য)\b/i.test(
        normalized,
      );

    const isActionableSelfHarm =
      /\b(how\s+to\s+(kill\s+myself|commit\s+suicide|cut\s+myself)|ways\s+to\s+die|i\s+want\s+to\s+die|মরে\s+যেতে\s+চাই|আত্মহত্যা\s+করার\s+উপায়|নিজেকে\s+শেষ|কীভাবে\s+মারা\s+যাব)\b/i.test(
        normalized,
      );

    if (isActionableSelfHarm) {
      this.logger.warn('AI Safety: Actionable self-harm query detected and mitigated');
      return {
        isSafe: false,
        category: SafetyCategory.SELF_HARM,
        reason: 'Actionable self-harm or suicide query',
        safeResponseBn:
          'তুমি একা নও। তোমার মানসিক সুস্থতা ও জীবন অত্যন্ত মূল্যবান। কঠিন সময়ে কারো সাথে কথা বললে স্বস্তি পাওয়া যায়। অনুগ্রহ করে এখনই তোমার অভিভাবক, শিক্ষক, অথবা পরিবারের কোনো বিশ্বস্ত বড়দের সাথে তোমার অনুভূতি শেয়ার করো। আমি শিক্ষণীয় বিষয়ে তোমার পাশে আছি।',
      };
    }

    if (
      !isEducationalSelfHarm &&
      /\b(suicide|kill\s+myself|আত্মহত্যা|মরে\s+যাওয়া)\b/i.test(normalized)
    ) {
      return {
        isSafe: false,
        category: SafetyCategory.SELF_HARM,
        reason: 'Self-harm or suicide reference',
        safeResponseBn:
          'তোমার নিরাপত্তা ও ভালো থাকা আমাদের কাছে সবচেয়ে গুরুত্বপূর্ণ। যদি তুমি কোনো মানসিক কষ্টে থাকো, তবে তোমার বাবা-মা বা বিশ্বস্ত কোনো অভিভাবকের সাথে কথা বলো। লেখাপড়া বিষয়ক যেকোনো প্রয়োজনে আমি সাহায্য করতে প্রস্তুত।',
      };
    }

    // 2. Weapons & Explosives (Actionable manufacture vs Chemistry curriculum)
    const isEducationalChemistryOrHistory =
      /\b(nctb|chemistry|reaction|history|chapter|syllabus|রাসায়নিক\s+বিক্রিয়া|ইতিহাস|অধ্যায়|পাঠ্যবই)\b/i.test(
        normalized,
      );

    const isActionableWeapon =
      /\b(how\s+to\s+(make|build|assemble)\s+(a\s+)?(bomb|weapon|explosive|gun)|বোমা\s+বানানোর\s+উপায়|অস্ত্র\s+তৈরি\s+পদ্ধতি)\b/i.test(
        normalized,
      );

    if (isActionableWeapon) {
      this.logger.warn('AI Safety: Actionable weapon manufacture query blocked');
      return {
        isSafe: false,
        category: SafetyCategory.WEAPONS,
        reason: 'Actionable weapon creation instructions',
        safeResponseBn:
          'আমি দুঃখিত, বিপজ্জনক অস্ত্র, বিস্ফোরক বা ক্ষতিকর বস্তু তৈরির কোনো নির্দেশনা আমি প্রদান করতে পারি না। আমি শুধুমাত্র জাতীয় শিক্ষাক্রম (NCTB) অনুমোদিত পাঠ্যবই সংক্রান্ত বিষয়ে উত্তর দিই।',
      };
    }

    if (
      !isEducationalChemistryOrHistory &&
      /\b(make\s+a\s+bomb|বোমা\s+বানানো)\b/i.test(normalized)
    ) {
      return {
        isSafe: false,
        category: SafetyCategory.WEAPONS,
        reason: 'Weapon generation request',
        safeResponseBn:
          'বিপজ্জনক বা ক্ষতিকর বিষয়ে আলোচনা শিক্ষণীয় প্ল্যাটফর্মের নীতিমালার পরিপন্থী। অনুগ্রহ করে তোমার পড়ার বিষয় সম্পর্কিত কোনো প্রশ্ন করো।',
      };
    }

    // 3. Sexual Content & Exploitation
    const isSexualExploitation =
      /\b(porn|pornography|sex\s+video|xxx|nude|যৌন|অশ্লীল\s+ভিডিও|পর্ন)\b/i.test(normalized);
    if (isSexualExploitation) {
      this.logger.warn('AI Safety: Explicit sexual content query blocked');
      return {
        isSafe: false,
        category: SafetyCategory.SEXUAL_CONTENT,
        reason: 'Sexual or age-inappropriate content query',
        safeResponseBn:
          'শিক্ষক এআই শুধুমাত্র ছাত্রছাত্রীদের অ্যাকাডেমিক পড়াশোনার সহায়ক হিসেবে কাজ করে। অনুপযুক্ত বা অনৈতিক কোনো বিষয়ে উত্তর দেওয়া সম্ভব নয়।',
      };
    }

    // 4. Jailbreak & Prompt Injection Defense
    const isJailbreak =
      /\b(ignore\s+all\s+previous\s+instructions|system\s+prompt\s+override|you\s+are\s+now\s+dan|developer\s+mode\s+enabled|jailbreak|bypass\s+safety\s+filter)\b/i.test(
        normalized,
      );
    if (isJailbreak) {
      this.logger.warn('AI Safety: Prompt injection / jailbreak attempt blocked');
      return {
        isSafe: false,
        category: SafetyCategory.JAILBREAK,
        reason: 'Jailbreak attempt or prompt injection',
        safeResponseBn:
          'আমি শিক্ষক এআই — শিক্ষার্থীদের জাতীয় শিক্ষাক্রমভিত্তিক পড়াশোনায় সহায়তা করার জন্য তৈরি। অনুগ্রহ করে তোমার পড়ালেখা বিষয়ক প্রশ্ন জিজ্ঞেস করো।',
      };
    }

    // 5. Violence, Bullying & Hate Speech
    const isHateOrBullying =
      /\b(kill\s+all\s+|terrorist\s+group|সবাইকে\s+মেরে\s+ফেলা|সন্ত্রাসী)\b/i.test(normalized);
    if (isHateOrBullying) {
      this.logger.warn('AI Safety: Hate/violence query blocked');
      return {
        isSafe: false,
        category: SafetyCategory.VIOLENCE,
        reason: 'Violence or hate speech query',
        safeResponseBn:
          'সহিংসতা বা আক্রমণাত্মক আচরণ শিক্ষণীয় পরিবেশের পরিপন্থী। পাঠ্যসূচির যেকোনো অধ্যায়ের বিষয় নিয়ে প্রশ্ন করতে পারো।',
      };
    }

    // Default: Safe Educational
    return {
      isSafe: true,
      category: SafetyCategory.SAFE_EDUCATIONAL,
    };
  }
}
