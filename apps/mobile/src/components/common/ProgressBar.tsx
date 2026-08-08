import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = colors.primary,
  height = 8,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.container, { height }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: spacing.borderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: spacing.borderRadius.full,
  },
});
