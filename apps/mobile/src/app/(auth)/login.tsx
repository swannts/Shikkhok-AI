import React from 'react';
import { useRouter } from 'expo-router';
import { LoginFeatureScreen } from '../../features/auth/LoginFeatureScreen';

export default function LoginRoute() {
  const router = useRouter();

  return (
    <LoginFeatureScreen
      onSuccess={() => router.replace('/(tabs)')}
      onGoSignup={() => router.push('/(auth)/signup')}
      onGoOTP={() => router.push('/(auth)/otp')}
    />
  );
}
