import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryProvider } from '../src/providers/QueryProvider';
import { useAuthStore } from '../src/store/useAuthStore';
import { LoadingState } from '../src/components/ui/LoadingState';

function RootNavigationLayout() {
  const { status, onboardingCompleted } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (status === 'authenticated') {
      if (!onboardingCompleted && !inOnboardingGroup) {
        router.replace('/(onboarding)');
      } else if (onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
        router.replace('/(tabs)');
      }
    }
  }, [status, onboardingCompleted, segments, isReady, router]);

  if (!isReady) {
    return <LoadingState message="অ্যাপ প্রস্তুত হচ্ছে..." />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="subject/[subjectId]" />
      <Stack.Screen name="chapter/[chapterId]" />
      <Stack.Screen name="lesson/[lessonId]" />
      <Stack.Screen name="practice/index" />
      <Stack.Screen name="practice/result" />
      <Stack.Screen name="homework/index" />
      <Stack.Screen name="exam/[examId]" />
      <Stack.Screen name="study-plan/index" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <RootNavigationLayout />
    </QueryProvider>
  );
}
