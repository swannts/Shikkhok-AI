import React from 'react';
import { useRouter } from 'expo-router';
import { SignupScreen } from '../../screens';

export default function SignupRoute() {
  const router = useRouter();

  return (
    <SignupScreen
      onSignupSubmit={() => router.push('/(auth)/verify-otp')}
      onLogin={() => router.push('/(auth)/login')}
    />
  );
}
