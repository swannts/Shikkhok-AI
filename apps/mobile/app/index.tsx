import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/useAuthStore';

export default function IndexRoute() {
  const { status, onboardingCompleted } = useAuthStore();

  if (status === 'unauthenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (!onboardingCompleted) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
