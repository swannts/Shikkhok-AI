import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  rightAction,
  subtitle,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
        )}
        {title && (
          <View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        )}
      </View>
      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  backText: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
