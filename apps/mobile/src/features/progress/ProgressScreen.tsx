import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { progressRepository } from '../../api/repositories/progressRepository';
import { t } from '../../localization/i18n';

interface ProgressScreenProps {
  onBack?: () => void;
  onPracticeTopic?: (topic: string) => void;
}

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ onBack, onPracticeTopic }) => {
  const { data: progress, isLoading, isError, refetch } = useQuery({
    queryKey: ['progressSummary'],
    queryFn: () => progressRepository.getProgressSummary(),
  });

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="পারফরম্যান্স ডাটা লোড হচ্ছে..." />
      </Screen>
    );
  }

  if (isError || !progress) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={{ marginBottom: spacing.xs }}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ← ফিরে যাও
            </AppText>
          </TouchableOpacity>
        )}

        <AppText variant="pageTitle" weight="bold">
          {t('progress.title')}
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginBottom: spacing.md }}>
          তোমার পারদর্শিতা ও দুর্বল টপিকসমূহ
        </AppText>

        {/* Overall Mastery Card */}
        <View style={styles.masteryCard}>
          <AppText variant="caption" color={colors.textSecondary} weight="bold">
            {t('progress.overallMastery')}
          </AppText>
          <AppText variant="display" color={colors.primary} weight="bold" style={{ marginVertical: 4 }}>
            {progress.overallMastery}%
          </AppText>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('progress.studyTime')}
              </AppText>
              <AppText variant="cardTitle" weight="bold">
                {progress.studyTimeHours}h
              </AppText>
            </View>
            <View style={styles.statBox}>
              <AppText variant="caption" color={colors.textSecondary}>
                {t('progress.accuracy')}
              </AppText>
              <AppText variant="cardTitle" weight="bold" color={colors.success}>
                {progress.accuracyRate}%
              </AppText>
            </View>
          </View>
        </View>

        {/* Needs Attention Topics */}
        <AppText variant="sectionTitle" weight="bold" style={styles.sectionHeader}>
          {t('progress.needsAttention')} ⚠️
        </AppText>

        {progress.needsAttention.map((item, idx) => (
          <View key={idx} style={styles.weakCard}>
            <View style={{ flex: 1 }}>
              <AppText variant="cardTitle" weight="bold">
                {item.topic}
              </AppText>
              <AppText variant="caption" color={colors.error} weight="bold">
                Mastery: {item.mastery}%
              </AppText>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onPracticeTopic && onPracticeTopic(item.topic)}
              style={styles.practiceBtn}
            >
              <AppText variant="caption" color={colors.white} weight="bold">
                প্র্যাকটিস
              </AppText>
            </TouchableOpacity>
          </View>
        ))}

        {/* Subject Mastery Breakdown */}
        <AppText variant="sectionTitle" weight="bold" style={styles.sectionHeader}>
          বিষয়ভিত্তিক স্কোর
        </AppText>

        <View style={styles.subjectBreakdownCard}>
          {progress.subjectMastery.map((sub, idx) => (
            <View key={idx} style={styles.subRow}>
              <AppText variant="bodySmall" weight="bold" style={{ width: 80 }}>
                {sub.subject}
              </AppText>
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${sub.mastery}%` }]} />
              </View>
              <AppText variant="caption" weight="bold" style={{ width: 40, textAlign: 'right' }}>
                {sub.mastery}%
              </AppText>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  masteryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    flex: 1,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  weakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  practiceBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  subjectBreakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 4,
    marginHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
