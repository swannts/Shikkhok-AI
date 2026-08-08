import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PracticeResultScreen } from '../../src/features/practice/PracticeResultScreen';
import { PracticeResultData } from '../../src/api/repositories/practiceRepository';

export default function PracticeResultRoute() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data?: string }>();

  const parsedData: PracticeResultData = data
    ? JSON.parse(data)
    : {
        sessionId: 'session-1',
        correctAnswers: 4,
        totalQuestions: 5,
        accuracyPercentage: 80,
        timeSpentSeconds: 120,
        initialMastery: 42,
        updatedMastery: 58,
        weakTopics: ['ভগ্নাংশের সমীকরণ'],
      };

  return (
    <PracticeResultScreen
      result={parsedData}
      onGoHome={() => router.replace('/(tabs)')}
      onRetryWeak={() => router.replace('/practice')}
    />
  );
}
