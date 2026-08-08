import { delay } from '../client';

export interface HomeworkDetectionResult {
  detectedText: string;
  subjectName: string;
  topicName: string;
  suggestedActions: { key: string; label: string }[];
}

export const homeworkRepository = {
  analyzeHomeworkImage: async (imageUri: string): Promise<HomeworkDetectionResult> => {
    await delay(600);
    return {
      detectedText: 'সমীকরণ সমাধান করো: 3x − 7 = 14',
      subjectName: 'সাধারণ গণিত',
      topicName: 'বীজগণিত (সরল সমীকরণ)',
      suggestedActions: [
        { key: 'hint', label: 'হিন্ট চাই 💡' },
        { key: 'step_by_step', label: 'ধাপে ধাপে বুঝাও 📝' },
        { key: 'verify', label: 'আমার উত্তর যাচাই করো ✅' },
        { key: 'explain_concept', label: 'এই বিষয়টা আগে বুঝাও 🧠' },
      ],
    };
  },
};
