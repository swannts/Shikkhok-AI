import React from 'react';
import { useRouter } from 'expo-router';
import { SearchScreen } from '../../screens';

export default function SearchRoute() {
  const router = useRouter();

  return <SearchScreen onBack={() => router.back()} />;
}
