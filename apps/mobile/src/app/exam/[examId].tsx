import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ExamSessionScreen } from '../../features/exams/ExamSessionScreen';

export default function ExamRoute() {
  const router = useRouter();
  const { examId } = useLocalSearchParams<{ examId: string }>();

  return (
    <ExamSessionScreen
      examId={examId || 'model-test-1'}
      onFinishExam={() => router.replace('/(tabs)')}
      onCancel={() => router.back()}
    />
  );
}
