import React from 'react';
import { useRouter } from 'expo-router';
import { ProgressScreen } from '../../features/progress/ProgressScreen';

export default function ProgressRoute() {
  const router = useRouter();

  return (
    <ProgressScreen
      onBack={() => router.back()}
      onPracticeTopic={() => router.push('/lesson/linear-equations')}
    />
  );
}
