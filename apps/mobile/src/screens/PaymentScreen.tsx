import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button } from '../components';

interface PaymentScreenProps {
  onPaySuccess?: () => void;
  onBack?: () => void;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({ onPaySuccess, onBack }) => {
  const [method, setMethod] = useState('bkash');

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="পেমেন্ট গেটওয়ে" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="filled" style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>মোট পরিশোধযোগ্য পরিমাণ</Text>
          <Text style={styles.amount}>৳ ২,৯৯৯</Text>
          <Text style={styles.summarySub}>বার্ষিক প্রিমিয়াম সাবস্ক্রিপশন</Text>
        </Card>

        <Text style={styles.sectionTitle}>পেমেন্ট মেথড সিলেক্ট করো</Text>

        {[
          { id: 'bkash', name: 'bKash', icon: '💖' },
          { id: 'nagad', name: 'Nagad', icon: '🟠' },
          { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => setMethod(item.id)}
            style={[styles.methodCard, method === item.id ? styles.activeMethod : null]}
          >
            <Text style={{ fontSize: 24, marginRight: spacing.sm }}>{item.icon}</Text>
            <Text style={styles.methodName}>{item.name}</Text>
          </TouchableOpacity>
        ))}

        <Button
          title="পেমেন্ট সম্পন্ন করুন (৳ ২,৯৯৯)"
          onPress={onPaySuccess || (() => {})}
          size="large"
          style={{ marginTop: spacing.xl }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  summaryCard: { alignItems: 'center', marginVertical: spacing.md },
  summaryLabel: { fontSize: typography.size.xs, color: colors.outline },
  amount: { fontSize: typography.size.display, fontWeight: '800', color: colors.primary, marginVertical: spacing.xs },
  summarySub: { fontSize: typography.size.xs, color: colors.onSurfaceVariant },
  sectionTitle: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface, marginBottom: spacing.sm },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginBottom: spacing.sm,
  },
  activeMethod: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.surfaceContainerLow },
  methodName: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface },
});
