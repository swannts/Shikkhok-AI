import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button } from '../components';

interface AIFeedbackScreenProps {
  onBack?: () => void;
}

export const AIFeedbackScreen: React.FC<AIFeedbackScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="রিপোর্ট ও মতামত" subtitle="AI অ্যাসেসমেন্ট & ফিডব্যাক" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.scoreTitle}>আজকের কুইজ স্কোর: ৮/১০</Text>
          <Text style={styles.subText}>সঠিকতা: ৮০% • সময়: ৮ মিনিট</Text>
        </Card>

        <Text style={styles.sectionTitle}>AI শিক্ষকের মূল্যায়ন</Text>
        <Card variant="filled" style={styles.card}>
          <Text style={styles.feedbackText}>
            "তুমি সমীকরণ সমাধানের পদ্ধতি খুব ভালো বুঝেছ! পরবর্তীতে ভগ্নাংশের সমীকরণে সামান্য নজর
            দিলে ১০০% স্কোর অর্জন করতে পারবে।"
          </Text>
        </Card>

        <Button
          title="আরও প্র্যাকটিস করো →"
          onPress={() => {}}
          size="large"
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  card: { marginVertical: spacing.xs },
  scoreTitle: { fontSize: typography.size.lg, fontWeight: '800', color: colors.primary },
  subText: { fontSize: typography.size.xs, color: colors.onSurfaceVariant, marginTop: 2 },
  sectionTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  feedbackText: { fontSize: typography.size.sm, color: colors.onSurfaceVariant, lineHeight: 22 },
});
