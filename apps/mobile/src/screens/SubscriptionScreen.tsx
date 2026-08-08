import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button, Badge } from '../components';

interface SubscriptionScreenProps {
  onSelectPlan?: () => void;
  onBack?: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({ onSelectPlan, onBack }) => {
  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="সাবস্ক্রিপশন প্ল্যান" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headline}>তোমার শেখার যাত্রা আরও সহজ করো 🚀</Text>

        {/* Monthly Plan */}
        <Card variant="outlined" style={styles.planCard}>
          <Text style={styles.planTitle}>মাসিক প্ল্যান</Text>
          <Text style={styles.price}>৳ ৪৯৯ <Text style={styles.unit}>/ মাস</Text></Text>
          <Text style={styles.feature}>• আনলিমিটেড AI টিউটর সাপোর্ট</Text>
          <Text style={styles.feature}>• সকল বিষয় ও কুইজ অ্যাক্সেস</Text>
          <Button title="প্ল্যান পছন্দ করুন" onPress={onSelectPlan || (() => {})} variant="outline" style={{ marginTop: spacing.md }} />
        </Card>

        {/* Annual Plan (Best Value) */}
        <Card variant="elevated" style={[styles.planCard, styles.popularPlan]}>
          <Badge label="জনপ্রিয় & সেভিং" variant="tertiary" style={{ marginBottom: spacing.xs }} />
          <Text style={styles.planTitle}>বার্ষিক প্ল্যান (৫০% ছাড়)</Text>
          <Text style={styles.price}>৳ ২,৯৯৯ <Text style={styles.unit}>/ বছর</Text></Text>
          <Text style={styles.feature}>• আনলিমিটেড AI টিউটর ও ভয়েস সাপোর্ট</Text>
          <Text style={styles.feature}>• পারসোনালাইজড প্র্যাকটিস ও রিপোর্ট</Text>
          <Button title="বার্ষিক সাবস্ক্রাইব করুন" onPress={onSelectPlan || (() => {})} size="large" style={{ marginTop: spacing.md }} />
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  headline: { fontSize: typography.size.xl, fontWeight: '800', color: colors.onSurface, textAlign: 'center', marginVertical: spacing.md },
  planCard: { marginVertical: spacing.sm },
  popularPlan: { borderWidth: 2, borderColor: colors.tertiaryContainer, backgroundColor: colors.surface },
  planTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.onSurface },
  price: { fontSize: typography.size.xxl, fontWeight: '800', color: colors.primary, marginVertical: spacing.xs },
  unit: { fontSize: typography.size.sm, color: colors.outline, fontWeight: '400' },
  feature: { fontSize: typography.size.sm, color: colors.onSurfaceVariant, marginVertical: 2 },
});
