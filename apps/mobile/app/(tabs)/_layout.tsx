import React from 'react';
import { Tabs } from 'expo-router';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'হোম',
          tabBarIcon: () => '🏠',
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'পড়াশোনা',
          tabBarIcon: () => '📖',
        }}
      />
      <Tabs.Screen
        name="tutor"
        options={{
          title: 'AI শিক্ষক',
          tabBarIcon: () => '🤖',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'অগ্রগতি',
          tabBarIcon: () => '📈',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'প্রোফাইল',
          tabBarIcon: () => '👤',
        }}
      />
    </Tabs>
  );
}
