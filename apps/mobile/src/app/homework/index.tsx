import React from 'react';
import { useRouter } from 'expo-router';
import { HomeworkScreen } from '../../features/homework/HomeworkScreen';

export default function HomeworkRoute() {
  const router = useRouter();

  return (
    <HomeworkScreen
      onAskTutorWithQuery={(query) => {
        router.push({
          pathname: '/(tabs)/tutor',
          params: { prompt: query },
        });
      }}
      onBack={() => router.back()}
    />
  );
}
