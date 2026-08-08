import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LessonScreen } from '../../features/lessons/LessonScreen';

export default function LessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

  return (
    <LessonScreen
      lessonId={lessonId || 'linear-equations'}
      onBack={() => router.back()}
      onAskTutor={(promptQuery) => {
        router.push({
          pathname: '/(tabs)/tutor',
          params: { prompt: promptQuery },
        });
      }}
    />
  );
}
