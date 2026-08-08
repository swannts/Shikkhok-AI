import React from 'react';
import { useRouter } from 'expo-router';
import { LearnScreen } from '../../src/features/curriculum/LearnScreen';

export default function LearnRoute() {
  const router = useRouter();

  return <LearnScreen onSelectSubject={(subjectId) => router.push(`/subject/${subjectId}`)} />;
}
