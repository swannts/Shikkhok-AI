import { typography } from './typography';
import { colors } from './colors';

export const accessibilityTheme = {
  /**
   * 1. Accessible Touch Targets (Minimum 48px x 48px per WCAG / Android Accessibility guidelines)
   */
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  /**
   * 2. High Contrast Colors (WCAG AAA 7:1 for body text, 4.5:1 for headers)
   */
  contrast: {
    highContrastText: '#0F172A',      // Slate 900 on Light
    highContrastBackground: '#FFFFFF',
    accessiblePrimary: '#3730A3',     // Indigo 800 (High Contrast Primary)
    errorText: '#991B1B',             // Red 800
  },

  /**
   * 3. Bangla Font & Line-Height Scaling for Low-End Android Devices
   * Extra line height (1.4x - 1.5x) prevents Bangla vowel diacritics (কার/ফলা) from clipping on Android.
   */
  banglaTypography: {
    fontFamily: {
      regular: 'Kalpurush', // Preferred fallback font for Bangla glyph rendering
      medium: 'Kalpurush',
      bold: 'Kalpurush',
    },
    lineHeightMultiplier: 1.45,
  },

  /**
   * 4. Helper props for Screen Readers (VoiceOver / TalkBack)
   */
  screenReaderProps: (label: string, hint?: string, role: 'button' | 'header' | 'link' | 'text' = 'button') => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
  }),
};
