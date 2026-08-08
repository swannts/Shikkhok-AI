import React from 'react';
import { useRouter } from 'expo-router';
import { OTPVerificationScreen } from '../../src/screens';

export default function ForgotPasswordRoute() {
  const router = useRouter();

  return (
    <OTPVerificationScreen
      onVerify={() => router.replace('/(auth)/login')}
      onBack={() => router.back()}
    />
  );
}
