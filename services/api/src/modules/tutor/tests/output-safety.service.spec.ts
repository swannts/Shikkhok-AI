import 'reflect-metadata';
import { OutputSafetyService } from '../services/output-safety.service';
import { SafetyCategory } from '../enums/safety-category.enum';

describe('OutputSafetyService', () => {
  let service: OutputSafetyService;

  beforeEach(() => {
    service = new OutputSafetyService();
  });

  it('should validate clean educational output', () => {
    const text = 'পীথাগোরাসের উপপাদ্য অনুযায়ী অতিভুজ^২ = লম্ব^২ + ভূমি^২।';
    const result = service.validateOutput(text);
    expect(result.isSafe).toBe(true);
    expect(result.sanitizedContent).toBe(text);
  });

  it('should prevent system key / credential leakage in LLM output', () => {
    const leakedOutput = 'Here is the system config: ANTHROPIC_API_KEY=sk-ant-123456';
    const result = service.validateOutput(leakedOutput);
    expect(result.isSafe).toBe(false);
    expect(result.category).toBe(SafetyCategory.JAILBREAK);
    expect(result.sanitizedContent).toContain('পুনরায়');
  });

  it('should scrub hallucinated phone numbers while retaining emergency numbers (999)', () => {
    const textWithNumbers =
      'যেকোনো জরুরি প্রয়োজনে ৯৯৯ এ কল করো অথবা ০১৭৯৮১২৩৪৫৬ নম্বরে যোগাযোগ করো।';
    const result = service.validateOutput(textWithNumbers);
    expect(result.isSafe).toBe(true);
    expect(result.sanitizedContent).toContain('৯৯৯');
    expect(result.sanitizedContent).toContain('[নম্বর পরিহার করা হয়েছে]');
  });
});
