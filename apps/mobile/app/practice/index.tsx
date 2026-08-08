import React from 'react';
import { useRouter } from 'expo-router';
import { PracticeSessionScreen } from '../../src/features/practice/PracticeSessionScreen';
import { practiceRepository } from '../../src/api/repositories';

export default function PracticeIndexRoute() {
  const router = useRouter();

  return (
    <PracticeSessionScreen
      onComplete={async (answers, timeSpent) => {
        const res = await practiceRepository.submitPracticeResults('session-1', answers, timeSpent);
        router.replace({
          pathname: '/practice/result',
          params: { data: JSON.stringify(res) },
        });
      }}
      onBack={() => router.back()}
    />
  );
}
