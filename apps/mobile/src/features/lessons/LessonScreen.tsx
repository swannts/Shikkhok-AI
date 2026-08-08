import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { lessonRepository } from '../../api/repositories/lessonRepository';

interface LessonScreenProps {
  lessonId: string;
  onBack: () => void;
  onAskTutor: (contextQuery?: string) => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  lessonId,
  onBack,
  onAskTutor,
}) => {
  const { data: lesson, isLoading, isError, refetch } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => lessonRepository.getLessonById(lessonId),
  });

  if (isLoading) {
    return (
      <Screen>
        <LoadingState message="পাঠ লোড হচ্ছে..." />
      </Screen>
    );
  }

  if (isError || !lesson) {
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
            ← বিষয়তালিকায় ফিরে যাও
          </AppText>
        </TouchableOpacity>

        {/* Title */}
        <AppText variant="caption" color={colors.primary} weight="bold">
          গণিত • অধ্যায় ৪ • সময়: {lesson.estimatedMinutes} মিনিট
        </AppText>
        <AppText variant="pageTitle" weight="bold" style={styles.lessonTitle}>
          {lesson.title}
        </AppText>

        {/* Content Blocks */}
        {lesson.blocks.map((block, index) => {
          if (block.type === 'explanation') {
            return (
              <View key={index} style={styles.blockMargin}>
                <AppText variant="body" color={colors.textPrimary} style={styles.paragraph}>
                  {block.body}
                </AppText>
              </View>
            );
          }

          if (block.type === 'importantNote') {
            return (
              <View key={index} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <AppText style={{ fontSize: 20, marginRight: 6 }}>💡</AppText>
                  <AppText variant="cardTitle" color={colors.primary} weight="bold">
                    {block.title || 'মনে রাখো'}
                  </AppText>
                </View>
                <AppText variant="bodySmall" color={colors.textSecondary}>
                  {block.body}
                </AppText>
              </View>
            );
          }

          if (block.type === 'example') {
            return (
              <View key={index} style={styles.exampleCard}>
                <AppText variant="cardTitle" weight="bold" style={{ marginBottom: 4 }}>
                  {block.title}
                </AppText>
                <AppText variant="bodySmall" color={colors.textPrimary}>
                  {block.body}
                </AppText>
                {block.formulaText && (
                  <View style={styles.formulaBox}>
                    <AppText variant="body" weight="bold" color={colors.primary} align="center">
                      {block.formulaText}
                    </AppText>
                  </View>
                )}
              </View>
            );
          }

          if (block.type === 'inlineQuiz') {
            return (
              <View key={index} style={styles.quizCard}>
                <AppText variant="cardTitle" color={colors.secondary} weight="bold">
                  {block.title}
                </AppText>
                <AppText variant="body" weight="semiBold" style={{ marginTop: 4 }}>
                  {block.body}
                </AppText>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onAskTutor(block.body)}
                  style={styles.quizCta}
                >
                  <AppText variant="button" color={colors.white} weight="bold">
                    AI শিক্ষকের সাথে প্র্যাকটিস করো 🤖
                  </AppText>
                </TouchableOpacity>
              </View>
            );
          }

          return null;
        })}

        {/* Ask AI Contextual CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onAskTutor(`আমি "${lesson.title}" অধ্যায় নিয়ে আরও কিছু শিখতে চাই।`)}
          style={styles.aiTutorCta}
        >
          <AppText style={{ fontSize: 24, marginRight: 8 }}>🤖</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="cardTitle" color={colors.primary} weight="bold">
              এই পাঠ নিয়ে AI শিক্ষককে জিজ্ঞেস করো
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              কোনো কিছু না বুঝলে প্রশ্ন করে ক্লিয়ার করে নাও
            </AppText>
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
  backButton: {
    marginBottom: spacing.xs,
  },
  lessonTitle: {
    marginTop: 4,
    marginBottom: spacing.md,
  },
  blockMargin: {
    marginBottom: spacing.md,
  },
  paragraph: {
    lineHeight: 26,
  },
  noteCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  exampleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  formulaBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  quizCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quizCta: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  aiTutorCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginTop: spacing.md,
  },
});
