import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'একটি সমস্যা হয়েছে',
  message = 'ডেটা লোড করতে ব্যর্থ হয়েছে। ইন্টারনেট পরীক্ষা করুন।',
  onRetry,
}) => {
  return (
    <View style={styles.container}>
      <AppText style={styles.icon}>⚠️</AppText>
      <AppText variant="cardTitle" weight="bold" color={colors.error} align="center">
        {title}
      </AppText>
      <AppText variant="bodySmall" color={colors.textSecondary} align="center" style={styles.message}>
        {message}
      </AppText>
      {onRetry && (
        <TouchableOpacity activeOpacity={0.8} onPress={onRetry} style={styles.button}>
          <AppText variant="button" color={colors.white} weight="bold">
            আবার চেষ্টা করুন
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  message: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xs,
  },
});
