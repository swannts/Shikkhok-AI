import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { colors, typography } from '../../theme';

export interface AppTextProps extends RNTextProps {
  variant?:
    | 'display'
    | 'pageTitle'
    | 'sectionTitle'
    | 'cardTitle'
    | 'body'
    | 'bodySmall'
    | 'caption'
    | 'button';
  color?: string;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  align?: 'left' | 'center' | 'right';
}

export const AppText: React.FC<AppTextProps> = ({
  children,
  variant = 'body',
  color = colors.textPrimary,
  weight = 'regular',
  align = 'left',
  style,
  ...props
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'display':
        return { fontSize: typography.size.display, lineHeight: typography.lineHeight.display };
      case 'pageTitle':
        return { fontSize: typography.size.headline, lineHeight: typography.lineHeight.headline };
      case 'sectionTitle':
        return { fontSize: typography.size.xxl, lineHeight: typography.lineHeight.xxl };
      case 'cardTitle':
        return { fontSize: typography.size.lg, lineHeight: typography.lineHeight.lg };
      case 'bodySmall':
        return { fontSize: typography.size.sm, lineHeight: typography.lineHeight.sm };
      case 'caption':
        return { fontSize: typography.size.xs, lineHeight: typography.lineHeight.xs };
      case 'button':
        return { fontSize: typography.size.md, lineHeight: typography.lineHeight.md };
      case 'body':
      default:
        return { fontSize: typography.size.md, lineHeight: typography.lineHeight.md };
    }
  };

  const getFontWeight = (): TextStyle => {
    switch (weight) {
      case 'bold':
        return { fontWeight: '700' };
      case 'semiBold':
        return { fontWeight: '600' };
      case 'medium':
        return { fontWeight: '500' };
      case 'regular':
      default:
        return { fontWeight: '400' };
    }
  };

  return (
    <RNText
      style={[
        getVariantStyle(),
        getFontWeight(),
        { color, textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};
