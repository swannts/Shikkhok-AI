import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { PracticeResultScreen } from '../../features/practice/PracticeResultScreen';
import { practiceRepository } from '../../api/repositories';
import { LoadingState } from '../../components/ui/LoadingState';

export default function PracticeResultRoute() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

  const { data: result, isLoading } = useQuery({
    queryKey: ['practiceResult', sessionId],
    queryFn: () => practiceRepository.submitPracticeResults(sessionId || 'session-1', {}, 120),
    staleTime: 1000 * 60 * 10,
  });

  if (isLoading || !result) {
    return <LoadingState message="ফলাফল লোড হচ্ছে..." />;
  }

  return (
    <PracticeResultScreen
      result={result}
      onGoHome={() => router.replace('/(tabs)')}
      onRetryWeak={() => router.replace('/practice')}
    />
  );
}
