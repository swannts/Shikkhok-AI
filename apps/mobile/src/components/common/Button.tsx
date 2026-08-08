import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = (): ViewStyle => {
    let base: ViewStyle = styles.base;

    switch (variant) {
      case 'secondary':
        base = { ...base, backgroundColor: colors.secondaryContainer };
        break;
      case 'tertiary':
        base = { ...base, backgroundColor: colors.tertiaryContainer };
        break;
      case 'outline':
        base = {
          ...base,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
        break;
      case 'text':
        base = { ...base, backgroundColor: 'transparent' };
        break;
      case 'primary':
      default:
        base = { ...base, backgroundColor: colors.primary };
        break;
    }

    switch (size) {
      case 'small':
        base = { ...base, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm };
        break;
      case 'large':
        base = { ...base, paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
        break;
      case 'medium':
      default:
        base = { ...base, paddingVertical: 12, paddingHorizontal: spacing.lg };
        break;
    }

    if (disabled) {
      base = { ...base, opacity: 0.5 };
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let text: TextStyle = styles.textBase;

    switch (variant) {
      case 'secondary':
        text = { ...text, color: colors.onSecondaryContainer };
        break;
      case 'tertiary':
      case 'primary':
        text = { ...text, color: colors.white };
        break;
      case 'outline':
      case 'text':
        text = { ...text, color: colors.primary };
        break;
    }

    switch (size) {
      case 'small':
        text = { ...text, fontSize: typography.size.sm };
        break;
      case 'large':
        text = { ...text, fontSize: typography.size.lg, fontWeight: '700' };
        break;
    }

    return text;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? colors.primary : colors.white}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), textStyle, icon ? { marginLeft: spacing.xs } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  textBase: {
    fontSize: typography.size.md,
    fontWeight: '600',
    textAlign: 'center',
  },
});
