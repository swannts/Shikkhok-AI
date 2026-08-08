import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { subjectRepository } from '../../api/repositories/subjectRepository';
import { chapterRepository } from '../../api/repositories/chapterRepository';

interface SubjectScreenProps {
  subjectId: string;
  onBack: () => void;
  onSelectChapter: (chapterId: string) => void;
}

export const SubjectScreen: React.FC<SubjectScreenProps> = ({
  subjectId,
  onBack,
  onSelectChapter,
}) => {
  const { data: subject, isLoading: isLoadingSubject } = useQuery({
    queryKey: ['subject', subjectId],
    queryFn: () => subjectRepository.getSubjectById(subjectId),
  });

  const {
    data: chapters,
    isLoading: isLoadingChapters,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['chapters', subjectId],
    queryFn: () => chapterRepository.getChaptersBySubject(subjectId),
  });

  if (isLoadingSubject || isLoadingChapters) {
    return (
      <Screen>
        <LoadingState message="অধ্যায়সমূহ লোড হচ্ছে..." />
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
        {/* Navigation Bar */}
        <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={styles.backButton}>
          <AppText variant="bodySmall" color={colors.primary} weight="bold">
            ← ফিরে যাও
          </AppText>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <AppText style={styles.subjectIcon}>{subject?.icon || '📐'}</AppText>
          <View style={{ marginLeft: spacing.sm }}>
            <AppText variant="pageTitle" weight="bold">
              {subject?.bnName} ({subject?.enName})
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              Class 8 • পাঠ্যক্রম ও অধ্যায়সমূহ
            </AppText>
          </View>
        </View>

        <AppText variant="sectionTitle" weight="bold" style={styles.sectionHeader}>
          অধ্যায় তালিকা
        </AppText>

        {chapters?.map((chap) => (
          <TouchableOpacity
            key={chap.id}
            activeOpacity={0.8}
            onPress={() => onSelectChapter(chap.id)}
            style={styles.chapCard}
          >
            <View style={styles.chapHeader}>
              <View style={{ flex: 1 }}>
                <AppText variant="caption" color={colors.primary} weight="bold">
                  অধ্যায় {chap.chapterNumber}
                </AppText>
                <AppText variant="cardTitle" weight="bold">
                  {chap.bnTitle}
                </AppText>
              </View>
              <AppText variant="bodySmall" color={colors.success} weight="bold">
                {Math.round(chap.progress * 100)}%
              </AppText>
            </View>

            <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 4 }}>
              {chap.lessonCount} পাঠ • {chap.practiceSetCount} প্র্যাকটিস সেট
            </AppText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subjectIcon: {
    fontSize: 40,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
  },
  chapCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});
