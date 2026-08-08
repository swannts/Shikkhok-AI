import React from 'react';
import { useRouter } from 'expo-router';
import { StudyPlanScreen } from '../../src/features/study-plan/StudyPlanScreen';

export default function StudyPlanRoute() {
  const router = useRouter();

  return (
    <StudyPlanScreen
      onBack={() => router.back()}
      onOpenLesson={() => router.push('/lesson/linear-equations')}
    />
  );
}
