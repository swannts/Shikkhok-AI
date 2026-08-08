import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput placeholderTextColor={colors.outline} style={[styles.input, style]} {...props} />
        {rightIcon && <View style={styles.iconContainer}>{rightIcon}</View>}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
    width: '100%',
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.size.md,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  iconContainer: {
    marginHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: typography.size.xs,
    color: colors.error,
    marginTop: 4,
  },
});
