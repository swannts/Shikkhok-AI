import { delay } from '../client';
import { Lesson } from '../types';

const mockLesson: Lesson = {
  id: 'linear-equations',
  chapterId: 'chap-4',
  title: 'সরল সমীকরণ ও সমাধান (Linear Equations)',
  estimatedMinutes: 15,
  progress: 0.6,
  blocks: [
    {
      type: 'explanation',
      body: 'সমীকরণ হলো একটি গাণিতিক বাক্য যেখানে দুটি রাশি সমান চিহ্ন (=) দ্বারা যুক্ত থাকে। অজানা বা অজ্ঞাত রাশিকে বলা হয় চলক (Variable)।',
    },
    {
      type: 'importantNote',
      title: 'মনে রাখো',
      body: 'সমীকরণের উভয় পক্ষে একই সংখ্যা যোগ, বিয়োগ, গুণ বা ভাগ করলে সমীকরণের মানের কোনো পরিবর্তন হয় না।',
    },
    {
      type: 'example',
      title: 'উদাহরণ ১:',
      body: 'ধরি, একটি সংখ্যা x। সংখ্যাটির সাথে 5 যোগ করলে যোগফল 17 হয়। সমীকরণটি গঠন ও সমাধান করো।',
      formulaText: 'x + 5 = 17\nবা, x + 5 - 5 = 17 - 5\n∴ x = 12',
    },
    {
      type: 'inlineQuiz',
      title: 'নিজে চেষ্টা করো',
      body: '2x + 6 = 16 হলে x এর মান কত?',
    },
  ],
};

export const lessonRepository = {
  getLessonById: async (lessonId: string): Promise<Lesson> => {
    await delay(350);
    return mockLesson;
  },
};
