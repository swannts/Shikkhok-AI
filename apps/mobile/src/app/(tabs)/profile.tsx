import React from 'react';
import { useRouter } from 'expo-router';
import { ProfileScreen } from '../../features/profile/ProfileScreen';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProfileRoute() {
  const router = useRouter();
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  return (
    <ProfileScreen
      onOpenParentDashboard={() => {}}
      onOpenSubscription={() => {}}
      onOpenNotifications={() => {}}
      onOpenDownloads={() => {}}
      onLogout={() => {
        setUnauthenticated();
        router.replace('/(auth)/login');
      }}
    />
  );
}
