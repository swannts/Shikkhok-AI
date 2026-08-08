import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📭', title, message }) => {
  return (
    <View style={styles.container}>
      <AppText style={styles.icon}>{icon}</AppText>
      <AppText variant="cardTitle" weight="bold" align="center">
        {title}
      </AppText>
      {message && (
        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          align="center"
          style={styles.message}
        >
          {message}
        </AppText>
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
  },
});
