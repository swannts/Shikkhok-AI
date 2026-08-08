import React from 'react';
import { useRouter } from 'expo-router';
import { SearchScreen } from '../../src/screens';

export default function SearchRoute() {
  const router = useRouter();

  return <SearchScreen onBack={() => router.back()} />;
}
