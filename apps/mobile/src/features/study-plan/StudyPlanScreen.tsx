import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { studyPlanRepository } from '../../api/repositories/studyPlanRepository';

interface StudyPlanScreenProps {
  onBack?: () => void;
  onOpenLesson: () => void;
}

export const StudyPlanScreen: React.FC<StudyPlanScreenProps> = ({ onBack, onOpenLesson }) => {
  const queryClient = useQueryClient();

  const {
    data: plan,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dailyStudyPlan'],
    queryFn: () => studyPlanRepository.getDailyStudyPlan(),
  });

  const toggleMutation = useMutation({
    mutationFn: (taskId: string) => studyPlanRepository.toggleTaskCompletion(taskId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['dailyStudyPlan'], updated);
    },
  });

  if (isLoading || !plan) {
    return (
      <Screen>
        <LoadingState message="স্টাডি প্ল্যান লোড হচ্ছে..." />
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

  const progressPercent = Math.round((plan.completedMinutes / plan.dailyGoalMinutes) * 100);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginBottom: spacing.xs }}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ← ফিরে যাও
            </AppText>
          </TouchableOpacity>
        )}

        <AppText variant="pageTitle" weight="bold">
          আমার স্টাডি প্ল্যান 📅
        </AppText>
        <AppText
          variant="bodySmall"
          color={colors.textSecondary}
          style={{ marginBottom: spacing.md }}
        >
          আজকের টার্গেট: {plan.dailyGoalMinutes} মিনিট পড়াশোনা
        </AppText>

        {/* Goal Tracker Card */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.textSecondary} weight="bold">
                আজকের অগ্রগতি
              </AppText>
              <AppText variant="display" color={colors.primary} weight="bold">
                {plan.completedMinutes} / {plan.dailyGoalMinutes} মিনিট
              </AppText>
            </View>
            <AppText variant="cardTitle" color={colors.success} weight="bold">
              {progressPercent}%
            </AppText>
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]}
            />
          </View>
        </View>

        {/* AI Recommendation Reason */}
        <View style={styles.recomBox}>
          <AppText variant="cardTitle" color={colors.primary} weight="bold">
            AI শিক্ষকের পরামর্শ 💡
          </AppText>
          <AppText variant="bodySmall" color={colors.textPrimary} style={{ marginTop: 4 }}>
            {plan.recommendationReason}
          </AppText>
        </View>

        {/* Tasks Checklist */}
        <AppText variant="sectionTitle" weight="bold" style={{ marginBottom: spacing.sm }}>
          আজকের রুটিন চেকক্লিপ
        </AppText>

        {plan.tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            activeOpacity={0.8}
            onPress={() => toggleMutation.mutate(task.id)}
            style={[styles.taskCard, task.completed ? styles.taskCompleted : null]}
          >
            <AppText style={{ fontSize: 22, marginRight: spacing.sm }}>
              {task.completed ? '✅' : '⚪'}
            </AppText>
            <View style={{ flex: 1 }}>
              <AppText
                variant="body"
                weight="bold"
                style={task.completed ? styles.completedText : null}
              >
                {task.title}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {task.subject} • {task.durationMinutes} মিনিট
              </AppText>
            </View>

            <TouchableOpacity onPress={onOpenLesson} style={styles.startTaskBtn}>
              <AppText variant="caption" color={colors.primary} weight="bold">
                পড়ুন →
              </AppText>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: { height: 10, backgroundColor: colors.primary, borderRadius: 5 },
  recomBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskCompleted: { backgroundColor: colors.surfaceContainerLow, opacity: 0.8 },
  completedText: { textDecorationLine: 'line-through', color: colors.textSecondary },
  startTaskBtn: { padding: spacing.xs },
});
