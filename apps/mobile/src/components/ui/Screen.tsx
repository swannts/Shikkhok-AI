import React from 'react';
import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import { OfflineBanner } from './OfflineBanner';
import { useUIStore } from '../../store/useUIStore';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ children, style, padded = true }) => {
  const isOffline = useUIStore((state) => state.isOffline);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      {isOffline && <OfflineBanner />}
      <View style={[styles.container, padded ? styles.padded : null, style]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.md,
  },
});
