import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { subjectRepository } from '../../api/repositories/subjectRepository';
import { t } from '../../localization/i18n';

interface LearnScreenProps {
  onSelectSubject: (subjectId: string) => void;
}

export const LearnScreen: React.FC<LearnScreenProps> = ({ onSelectSubject }) => {
  const {
    data: subjects,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => subjectRepository.getSubjects(),
  });

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="পাঠ্যক্রম লোড হচ্ছে..." />
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
        <View style={styles.header}>
          <AppText variant="pageTitle" weight="bold">
            {t('learn.title')}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {t('learn.subtitle')} • Class 8
          </AppText>
        </View>

        <View style={styles.grid}>
          {subjects?.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              activeOpacity={0.8}
              onPress={() => onSelectSubject(sub.id)}
              style={[styles.card, { backgroundColor: sub.colorBg }]}
            >
              <AppText style={styles.icon}>{sub.icon}</AppText>
              <AppText variant="cardTitle" weight="bold" style={styles.title}>
                {sub.bnName}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {sub.enName}
              </AppText>

              <View style={styles.metaRow}>
                <AppText variant="caption" color={colors.primary} weight="bold">
                  {sub.chapterCount} অধ্যায় • {sub.lessonCount} পাঠ
                </AppText>
              </View>
            </TouchableOpacity>
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
  header: {
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 36,
    marginBottom: spacing.xs,
  },
  title: {
    marginTop: 2,
  },
  metaRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
