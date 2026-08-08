import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export type TabKey = 'home' | 'lesson' | 'practice' | 'profile';

interface BottomNavigationProps {
  activeTab: TabKey;
  onTabSelect: (tab: TabKey) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabSelect,
}) => {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'হোম', icon: '🏠' },
    { key: 'lesson', label: 'পড়াশোনা', icon: '📚' },
    { key: 'practice', label: 'প্র্যাকটিস', icon: '⚡' },
    { key: 'profile', label: 'প্রোফাইল', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.8}
            onPress={() => onTabSelect(tab.key)}
            style={styles.tabItem}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.primary : colors.outline },
                isActive ? styles.activeLabel : null,
              ]}
            >
              {tab.label}
            </Text>
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-around',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minWidth: 64,
  },
  icon: {
    fontSize: 20,
    marginBottom: 2,
  },
  label: {
    fontSize: typography.size.xs,
    fontWeight: '500',
  },
  activeLabel: {
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});
