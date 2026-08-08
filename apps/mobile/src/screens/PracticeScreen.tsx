import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card, Button, Badge, BottomNavigation, TabKey } from '../components';

interface PracticeScreenProps {
  onNavigateTab: (tab: TabKey) => void;
  onStartQuiz: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  onNavigateTab,
  onStartQuiz,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>প্র্যাকটিস হাব ⚡</Text>
          <Text style={styles.subtitle}>
            তোমার দুর্বলতাগুলো কাটিয়ে উঠতে সাহায্য করবে
          </Text>
        </View>

        {/* Daily Focus Practice */}
        <Card variant="elevated" style={styles.dailyCard}>
          <View style={styles.badgeRow}>
            <Text style={{ fontSize: 20, marginRight: 6 }}>📅</Text>
            <Text style={styles.badgeText}>দৈনিক প্র্যাকটিস</Text>
          </View>

          <Text style={styles.dailyTitle}>আজকের লক্ষ্য: পদার্থবিজ্ঞান</Text>
          <Text style={styles.dailySubtitle}>গতিবিদ্যা অধ্যায়ের গুরুত্বপূর্ণ প্রশ্ন</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>📝 ২০ প্রশ্ন</Text>
            <Text style={styles.metaItem}>⏱️ ৩০ মিনিট</Text>
          </View>

          <Button
            title="শুরু করো"
            onPress={onStartQuiz}
            size="large"
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.streakContainer}>
            <View style={styles.streakHeader}>
              <Text style={styles.streakLabel}>সাপ্তাহিক প্র্যাকটিস স্ট্রিক</Text>
              <Text style={styles.streakValue}>৪/৭ দিন</Text>
            </View>
            <View style={styles.streakBars}>
              <View style={[styles.streakBar, styles.streakActive]} />
              <View style={[styles.streakBar, styles.streakActive]} />
              <View style={[styles.streakBar, styles.streakActive]} />
              <View style={[styles.streakBar, styles.streakActive]} />
              <View style={[styles.streakBar, styles.streakInactive]} />
              <View style={[styles.streakBar, styles.streakInactive]} />
              <View style={[styles.streakBar, styles.streakInactive]} />
            </View>
          </View>
        </Card>

        {/* Modes Grid */}
        <Text style={styles.sectionTitle}>প্র্যাকটিস মোড</Text>
        <View style={styles.modesRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={onStartQuiz} style={styles.modeCard}>
            <Text style={styles.modeIcon}>⏱️</Text>
            <Text style={styles.modeTitle}>কুইজ মোড</Text>
            <Text style={styles.modeSub}>টাইমার সহ টেস্ট</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={onStartQuiz} style={styles.modeCard}>
            <Text style={styles.modeIcon}>🎯</Text>
            <Text style={styles.modeTitle}>অধ্যায়ভিত্তিক</Text>
            <Text style={styles.modeSub}>বিষয় ভিত্তিক প্র্যাকটিস</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modesRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={onStartQuiz} style={styles.modeCard}>
            <Text style={styles.modeIcon}>📋</Text>
            <Text style={styles.modeTitle}>মডেল টেস্ট</Text>
            <Text style={styles.modeSub}>পূর্ণাঙ্গ পরীক্ষা</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={onStartQuiz} style={styles.modeCard}>
            <Text style={styles.modeIcon}>🔥</Text>
            <Text style={styles.modeTitle}>দুর্বল বিষয়</Text>
            <Text style={styles.modeSub}>AI সাজেস্টেড</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation activeTab="practice" onTabSelect={onNavigateTab} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  headerSection: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.size.headline,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
  },
  dailyCard: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  dailyTitle: {
    fontSize: typography.size.xl,
    fontWeight: '800',
    color: colors.onSurface,
    marginTop: 4,
  },
  dailySubtitle: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  metaItem: {
    fontSize: typography.size.xs,
    color: colors.outline,
    marginRight: spacing.md,
    fontWeight: '600',
  },
  streakContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHighest,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  streakLabel: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
  },
  streakValue: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  streakBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  streakActive: {
    backgroundColor: colors.success,
  },
  streakInactive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  modesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  modeTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.onSurface,
  },
  modeSub: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
});
