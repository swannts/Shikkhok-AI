import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { subjectRepository } from '../../api/repositories/subjectRepository';
import { progressRepository } from '../../api/repositories/progressRepository';
import { useAuthStore } from '../../store/useAuthStore';
import { t } from '../../localization/i18n';

interface HomeScreenProps {
  onNavigateLearn: () => void;
  onOpenSubject: (subjectId: string) => void;
  onOpenLesson: (lessonId: string) => void;
  onOpenTutor: () => void;
  onOpenProgress: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigateLearn,
  onOpenSubject,
  onOpenLesson,
  onOpenTutor,
  onOpenProgress,
}) => {
  const user = useAuthStore((state) => state.user);

  const {
    data: subjects,
    isLoading: isLoadingSubjects,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectRepository.getSubjects(),
  });

  const { data: progress } = useQuery({
    queryKey: ['progressSummary'],
    queryFn: () => progressRepository.getProgressSummary(),
  });

  if (isLoadingSubjects) {
    return (
      <Screen>
        <LoadingState message="হোম লোড হচ্ছে..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <AppText variant="pageTitle" weight="bold">
              {t('home.greeting', { name: user?.name || 'রাফি' })}
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {t('home.subgreeting')}
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText variant="caption" color={colors.primary} weight="bold">
              {user?.className || 'Class 8'}
            </AppText>
          </View>
        </View>

        {/* Ask AI Tutor Banner */}
        <TouchableOpacity activeOpacity={0.9} onPress={onOpenTutor} style={styles.tutorCard}>
          <View style={styles.tutorHeader}>
            <View style={styles.iconCircle}>
              <AppText style={{ fontSize: 24 }}>🤖</AppText>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <AppText variant="cardTitle" weight="bold">
                {t('home.askTutor')}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                যেকোনো কঠিন প্রশ্নের উত্তর সহজ ভাষায় বুঝে নাও
              </AppText>
            </View>
          </View>

          <View style={styles.searchBarMock}>
            <AppText style={{ marginRight: 8 }}>🔍</AppText>
            <AppText variant="bodySmall" color={colors.outline} style={{ flex: 1 }}>
              {t('home.searchPlaceholder')}
            </AppText>
            <AppText style={{ fontSize: 16 }}>🎙️</AppText>
          </View>
        </TouchableOpacity>

        {/* Continue Learning */}
        <View style={styles.sectionHeader}>
          <AppText variant="sectionTitle" weight="bold">
            {t('home.continueLearning')}
          </AppText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onOpenLesson('linear-equations')}
          style={styles.continueCard}
        >
          <View style={styles.continueRow}>
            <View style={styles.subjectIconBox}>
              <AppText style={{ fontSize: 28 }}>📐</AppText>
            </View>
            <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
              <AppText variant="caption" color={colors.secondary} weight="bold">
                গণিত • অধ্যায় ৪
              </AppText>
              <AppText variant="cardTitle" weight="bold">
                সরল সমীকরণ ও সমাধান
              </AppText>
              <AppText
                variant="caption"
                color={colors.success}
                weight="semiBold"
                style={{ marginTop: 2 }}
              >
                Mastery: 42%
              </AppText>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onOpenLesson('linear-equations')}
              style={styles.continueButton}
            >
              <AppText variant="button" color={colors.white} weight="bold">
                চালিয়ে যাও
              </AppText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* Subjects Section */}
        <View style={styles.sectionHeader}>
          <AppText variant="sectionTitle" weight="bold">
            {t('home.subjects')}
          </AppText>
          <TouchableOpacity onPress={onNavigateLearn}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              {t('common.seeAll')} →
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
          {subjects?.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              activeOpacity={0.8}
              onPress={() => onOpenSubject(sub.id)}
              style={[styles.subjectItem, { backgroundColor: sub.colorBg }]}
            >
              <AppText style={styles.subIcon}>{sub.icon}</AppText>
              <AppText variant="bodySmall" weight="bold">
                {sub.bnName}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {sub.chapterCount} অধ্যায়
              </AppText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress Quick Banner */}
        <TouchableOpacity activeOpacity={0.8} onPress={onOpenProgress} style={styles.progressCard}>
          <View style={styles.progressRow}>
            <View>
              <AppText variant="caption" color={colors.textSecondary} weight="bold">
                আজকের পারদর্শিতা স্কোর
              </AppText>
              <AppText variant="display" color={colors.primary} weight="bold">
                {progress?.overallMastery || 72}%
              </AppText>
            </View>
            <View style={styles.progressBadge}>
              <AppText variant="bodySmall" color={colors.success} weight="bold">
                ভালো অগ্রগতি 📈
              </AppText>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  tutorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tutorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarMock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  continueCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  subjectsScroll: {
    marginVertical: spacing.xs,
  },
  subjectItem: {
    width: 100,
    height: 110,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
});
