import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TutorScreen } from '../../src/features/tutor/TutorScreen';

export default function TutorRoute() {
  const router = useRouter();
  const { prompt } = useLocalSearchParams<{ prompt?: string }>();

  return <TutorScreen initialPrompt={prompt} onBack={() => router.back()} />;
}
