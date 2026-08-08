import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoIcon}>🎓</Text>
        </View>
        <Text style={styles.brandTitle}>Shikkhok AI</Text>
        <Text style={styles.tagline}>শিখি। বুঝি। এগিয়ে যাই।</Text>
      </View>

      <View style={styles.footer}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        <Text style={styles.statusText}>Initializing workspace...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.surfaceContainerLow,
    marginBottom: spacing.lg,
  },
  logoIcon: {
    fontSize: 48,
  },
  brandTitle: {
    fontSize: typography.size.display,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: typography.size.md,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loader: {
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    color: colors.outline,
  },
});
