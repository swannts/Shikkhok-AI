import React from 'react';
import { useRouter } from 'expo-router';
import { OnboardingFlowScreen } from '../../src/features/onboarding/OnboardingFlowScreen';

export default function OnboardingRoute() {
  const router = useRouter();

  return (
    <OnboardingFlowScreen
      onFinish={() => router.replace('/(tabs)')}
    />
  );
}
