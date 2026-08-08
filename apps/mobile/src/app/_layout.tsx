import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryProvider } from '../providers/QueryProvider';
import { useAuthStore } from '../store/useAuthStore';
import { LoadingState } from '../components/ui/LoadingState';

function RootNavigationLayout() {
  const { status, onboardingCompleted, restoreSession } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (status === 'unknown') return;

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
  }, [status, onboardingCompleted, segments, router]);

  if (status === 'unknown') {
    return <LoadingState message="সেশন যাচাই করা হচ্ছে..." />;
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
