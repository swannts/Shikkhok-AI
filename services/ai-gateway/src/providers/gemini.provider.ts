import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, TutorRequest } from './provider.interface';

export class GeminiProvider implements LLMProvider {
  public name = 'GeminiProvider';
  private genAI: GoogleGenerativeAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || 'MOCK_KEY';
    this.genAI = new GoogleGenerativeAI(key);
  }

  async *streamChat(input: TutorRequest): AsyncIterable<string> {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MOCK_KEY') {
        const modelName = input.model || 'gemini-1.5-flash';
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const lastMessage = input.messages[input.messages.length - 1]?.content || '';

        const result = await model.generateContentStream(lastMessage);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            yield text;
          }
        }
        return;
      }
    } catch (err) {
      console.warn('[GeminiProvider] Falling back to simulated stream:', err);
    }

    // Simulated streaming fallback when key is not configured or in dev offline mode
    const simulatedDeltas = [
      'খুব ভালো প্রশ্ন! ',
      'এক চলক বিশিষ্ট সরল সমীকরণের ক্ষেত্রে ',
      'বাম পাশের সমীকরণটি ডান পাশে নেওয়ার সময় ',
      'যোগ থাকলে বিয়োগ এবং বিয়োগ থাকলে যোগ করতে হয়।\n\n',
      'যেমন: 2x + 5 = 15 সমীকরণে 5 বিয়োগ করলে 2x = 10 হয়। ',
      'অতএব, x = 5।\n\n',
      'তুমি কি আরেকটি প্র্যাকটিস সমস্যা সমাধান করতে চাও?',
    ];

    for (const delta of simulatedDeltas) {
      yield delta;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}
