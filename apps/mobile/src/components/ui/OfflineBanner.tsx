import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { AppText } from './AppText';

export const OfflineBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <AppText variant="caption" color={colors.white} weight="semiBold" align="center">
        ⚠️ ইন্টারনেট সংযোগ পাওয়া যাচ্ছে না। ক্যাশড ডাটা দেখানো হচ্ছে।
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
