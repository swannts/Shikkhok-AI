import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SubjectScreen } from '../../src/features/curriculum/SubjectScreen';

export default function SubjectRoute() {
  const router = useRouter();
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();

  return (
    <SubjectScreen
      subjectId={subjectId || 'math'}
      onBack={() => router.back()}
      onSelectChapter={(chapId) => router.push(`/chapter/${chapId}`)}
    />
  );
}
