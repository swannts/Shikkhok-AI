import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'filled';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        };
      case 'filled':
        return {
          backgroundColor: colors.surfaceContainerLow,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        };
    }
  };

  return <View style={[styles.card, getVariantStyle(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
});
