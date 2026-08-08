import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components';

interface PaymentSuccessScreenProps {
  onGoHome?: () => void;
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({ onGoHome }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={{ fontSize: 60 }}>🎉</Text>
      </View>

      <Text style={styles.title}>পেমেন্ট সফল হয়েছে!</Text>
      <Text style={styles.subtitle}>
        অভিনন্দন! তোমার Shikkhok AI বার্ষিক প্রিমিয়াম সাবস্ক্রিপশন সফলভাবে চালু করা হয়েছে।
      </Text>

      <Button
        title="শেখা শুরু করো →"
        onPress={onGoHome || (() => {})}
        size="large"
        style={{ width: '100%', marginTop: spacing.xl }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: typography.size.headline, fontWeight: '800', color: colors.onSurface, marginBottom: spacing.xs },
  subtitle: { fontSize: typography.size.md, color: colors.onSurfaceVariant, textAlign: 'center', lineHeight: 24 },
});
