import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Badge, ProgressBar } from '../components';

interface ParentDashboardScreenProps {
  onBack?: () => void;
}

export const ParentDashboardScreen: React.FC<ParentDashboardScreenProps> = ({ onBack }) => {
  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="অভিভাবক ড্যাশবোর্ড" subtitle="রাফির পড়াশোনার সার্বিক চিত্র" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Weekly Time Spent */}
        <Card variant="elevated" style={styles.card}>
          <Text style={styles.cardTitle}>এই সপ্তাহের মোট পড়া</Text>
          <Text style={styles.statValue}>১২ ঘণ্টা ৩০ মিনিট</Text>
          <Text style={styles.statSub}>গত সপ্তাহের চেয়ে ২০% বেশি 📈</Text>
        </Card>

        {/* Subject Progress */}
        <Text style={styles.sectionTitle}>বিষয়ভিত্তিক অগ্রগতি</Text>
        <Card variant="outlined" style={styles.card}>
          <View style={styles.subRow}>
            <Text style={styles.subName}>গণিত</Text>
            <Text style={styles.subPercent}>৮৫%</Text>
          </View>
          <ProgressBar progress={0.85} color={colors.primary} />

          <View style={[styles.subRow, { marginTop: spacing.sm }]}>
            <Text style={styles.subName}>বিজ্ঞান</Text>
            <Text style={styles.subPercent}>৭০%</Text>
          </View>
          <ProgressBar progress={0.7} color={colors.secondary} />
        </Card>

        {/* AI Insight */}
        <Card variant="filled" style={styles.card}>
          <View style={styles.insightHeader}>
            <Text style={{ fontSize: 20, marginRight: 6 }}>💡</Text>
            <Text style={styles.insightTitle}>AI শিক্ষকের পর্যবেক্ষণ</Text>
          </View>
          <Text style={styles.insightText}>
            "রাফি বীজগণিতে খুব ভালো করছে, তবে জ্যামিতিতে কিছু প্র্যাকটিস প্রয়োজন।"
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  card: { marginVertical: spacing.xs },
  cardTitle: { fontSize: typography.size.xs, color: colors.outline, textTransform: 'uppercase' },
  statValue: { fontSize: typography.size.xxl, fontWeight: '800', color: colors.onSurface, marginVertical: spacing.xs },
  statSub: { fontSize: typography.size.xs, color: colors.success, fontWeight: '600' },
  sectionTitle: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  subName: { fontSize: typography.size.sm, fontWeight: '600', color: colors.onSurface },
  subPercent: { fontSize: typography.size.sm, fontWeight: '700', color: colors.primary },
  insightHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  insightTitle: { fontSize: typography.size.sm, fontWeight: '700', color: colors.primary },
  insightText: { fontSize: typography.size.sm, color: colors.onSurfaceVariant, fontStyle: 'italic' },
});
