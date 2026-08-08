import React from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';

export default function HomeRoute() {
  const router = useRouter();

  return (
    <HomeScreen
      onNavigateLearn={() => router.push('/(tabs)/learn')}
      onOpenSubject={(subjectId) => router.push(`/subject/${subjectId}`)}
      onOpenLesson={(lessonId) => router.push(`/lesson/${lessonId}`)}
      onOpenTutor={() => router.push('/(tabs)/tutor')}
      onOpenProgress={() => router.push('/(tabs)/progress')}
    />
  );
}
