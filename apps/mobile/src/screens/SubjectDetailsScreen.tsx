import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button, ProgressBar } from '../components';

interface SubjectDetailsScreenProps {
  onBack?: () => void;
  onSelectChapter?: () => void;
}

export const SubjectDetailsScreen: React.FC<SubjectDetailsScreenProps> = ({
  onBack,
  onSelectChapter,
}) => {
  const chapters = [
    { id: '1', title: 'অধ্যায় ১: প্যাটার্ন', progress: 1.0, count: '৮টি পাঠ' },
    { id: '2', title: 'অধ্যায় ২: মুনাফা', progress: 0.8, count: '১০টি পাঠ' },
    { id: '3', title: 'অধ্যায় ৩: বীজগণিতীয় রাশি', progress: 0.4, count: '১২টি পাঠ' },
    { id: '4', title: 'অধ্যায় ৪: সরল সমীকরণ', progress: 0.0, count: '৬টি পাঠ' },
  ];

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="গণিত (Mathematics)" subtitle="Class 8 • পাঠ্যক্রম" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Card */}
        <Card variant="elevated" style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <Text style={{ fontSize: 32 }}>📐</Text>
            <View style={{ marginLeft: spacing.sm, flex: 1 }}>
              <Text style={styles.bannerTitle}>সাধারণ গণিত</Text>
              <Text style={styles.bannerSubtitle}>মোট অগ্রগতি: ৫৫% সম্পন্ন</Text>
            </View>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <ProgressBar progress={0.55} color={colors.primary} />
          </View>
        </Card>

        {/* Chapters list */}
        <Text style={styles.sectionTitle}>অধ্যায়সমূহ</Text>
        {chapters.map((chap) => (
          <TouchableOpacity key={chap.id} activeOpacity={0.8} onPress={onSelectChapter}>
            <Card variant="outlined" style={styles.chapterCard}>
              <View style={styles.chapterRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chapTitle}>{chap.title}</Text>
                  <Text style={styles.chapCount}>{chap.count}</Text>
                </View>
                <Text style={styles.chapPercent}>{Math.round(chap.progress * 100)}%</Text>
              </View>
              <View style={{ marginTop: spacing.xs }}>
                <ProgressBar
                  progress={chap.progress}
                  color={chap.progress === 1 ? colors.success : colors.primary}
                />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  bannerCard: { backgroundColor: colors.surfaceContainerLow, marginBottom: spacing.lg },
  bannerHeader: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: typography.size.lg, fontWeight: '800', color: colors.onSurface },
  bannerSubtitle: { fontSize: typography.size.xs, color: colors.onSurfaceVariant },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  chapterCard: { marginVertical: spacing.xs },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  chapTitle: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface },
  chapCount: { fontSize: typography.size.xs, color: colors.onSurfaceVariant },
  chapPercent: { fontSize: typography.size.sm, fontWeight: '700', color: colors.primary },
});
