import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/ui/Screen';
import { AppText } from '../src/components/ui/AppText';
import { colors, spacing, radius } from '../src/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <View style={styles.container}>
        <AppText style={{ fontSize: 48, marginBottom: spacing.sm }}>🔍</AppText>
        <AppText variant="pageTitle" weight="bold" align="center">
          পৃষ্ঠাটি পাওয়া যায়নি
        </AppText>
        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          align="center"
          style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}
        >
          তুমি যে লিংকে এসেছো সেটি বিদ্যমান নেই।
        </AppText>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
          style={styles.btn}
        >
          <AppText variant="button" color={colors.white} weight="bold">
            হোমে ফিরে যাও 🏠
          </AppText>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  btn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
});
