import React from 'react';
import { useRouter } from 'expo-router';
import { NotificationsScreen } from '../../screens';

export default function NotificationsRoute() {
  const router = useRouter();

  return <NotificationsScreen onBack={() => router.back()} />;
}
