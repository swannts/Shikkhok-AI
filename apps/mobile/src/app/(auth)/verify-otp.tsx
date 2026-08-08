import React from 'react';
import { useRouter } from 'expo-router';
import { OTPVerificationScreen } from '../../screens';

export default function VerifyOTPRoute() {
  const router = useRouter();

  return (
    <OTPVerificationScreen
      onVerify={() => router.replace('/(onboarding)')}
      onBack={() => router.back()}
    />
  );
}
