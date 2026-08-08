import { delay } from '../client';
import { TutorMessage } from '../types';

const initialMessages: TutorMessage[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content: 'হ্যালো! আমি তোমার Shikkhok AI শিক্ষক। গণিত বা যেকোনো বিষয় সম্পর্কে তোমার কী প্রশ্ন আছে?',
    createdAt: new Date().toISOString(),
    actions: [
      { label: 'একটি বিষয় বুঝিয়ে দাও', actionKey: 'explain' },
      { label: 'একটি অংকে সাহায্য করো', actionKey: 'solve' },
      { label: 'প্র্যাকটিস করাও', actionKey: 'practice' },
    ],
  },
];

export const tutorRepository = {
  getConversationHistory: async (topicId?: string): Promise<TutorMessage[]> => {
    await delay(250);
    return initialMessages;
  },

  sendMessage: async (
    userText: string,
    onChunk?: (partialText: string) => void
  ): Promise<TutorMessage> => {
    await delay(400);

    const fullResponse = `খুব সুন্দর প্রশ্ন! চলো ধাপে ধাপে সমাধান করি।\n\nপ্রশ্নটি হলো: "${userText}"\n\nপ্রথমে চলকটি একপাশে রাখতে হবে। দুই পাশ থেকে ধ্রুবকটি বিয়োগ করো।\nতুমি কি চেষ্টা করবে?`;

    // Simulate text streaming chunks
    if (onChunk) {
      const parts = fullResponse.split(' ');
      let accumulated = '';
      for (const part of parts) {
        accumulated += (accumulated ? ' ' : '') + part;
        onChunk(accumulated);
        await delay(40);
      }
    }

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: fullResponse,
      createdAt: new Date().toISOString(),
      actions: [
        { label: 'হিন্ট দাও', actionKey: 'hint' },
        { label: 'আরও সহজ করে বলো', actionKey: 'simpler' },
        { label: 'আমি বুঝেছি', actionKey: 'understood' },
      ],
    };
  },
};
