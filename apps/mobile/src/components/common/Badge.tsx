import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'tertiary';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: colors.secondaryContainer, text: colors.onSecondaryContainer };
      case 'success':
        return { bg: colors.successContainer, text: colors.success };
      case 'warning':
        return { bg: colors.warningContainer, text: colors.warning };
      case 'tertiary':
        return { bg: colors.tertiaryFixed, text: colors.tertiary };
      case 'primary':
      default:
        return { bg: colors.primaryFixed, text: colors.onPrimaryFixed };
    }
  };

  const currentColors = getBadgeColors();

  return (
    <View style={[styles.badge, { backgroundColor: currentColors.bg }, style]}>
      <Text style={[styles.text, { color: currentColors.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: typography.size.xs,
    fontWeight: '600',
  },
});
