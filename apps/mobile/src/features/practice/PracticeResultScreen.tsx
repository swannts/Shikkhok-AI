import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { PracticeResultData } from '../../api/repositories/practiceRepository';

interface PracticeResultScreenProps {
  result: PracticeResultData;
  onGoHome: () => void;
  onRetryWeak: () => void;
}

export const PracticeResultScreen: React.FC<PracticeResultScreenProps> = ({
  result,
  onGoHome,
  onRetryWeak,
}) => {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Trophy */}
        <View style={styles.trophyContainer}>
          <AppText style={{ fontSize: 64 }}>🏆</AppText>
          <AppText variant="pageTitle" weight="bold" style={{ marginTop: spacing.xs }}>
            প্র্যাকটিস রেজাল্ট!
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            সময়: {Math.floor(result.timeSpentSeconds / 60)} মিনিট {result.timeSpentSeconds % 60}{' '}
            সেকেন্ড
          </AppText>
        </View>

        {/* Score Breakdown Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <AppText variant="caption" color={colors.textSecondary}>
                সঠিক উত্তর
              </AppText>
              <AppText variant="display" color={colors.success} weight="bold">
                {result.correctAnswers}/{result.totalQuestions}
              </AppText>
            </View>

            <View style={styles.scoreBox}>
              <AppText variant="caption" color={colors.textSecondary}>
                সঠিকতা
              </AppText>
              <AppText variant="display" color={colors.primary} weight="bold">
                {result.accuracyPercentage}%
              </AppText>
            </View>
          </View>

          {/* Mastery Increase Banner */}
          <View style={styles.masteryBanner}>
            <AppText variant="bodySmall" weight="bold">
              Linear Equations Mastery:
            </AppText>
            <AppText
              variant="cardTitle"
              color={colors.primary}
              weight="bold"
              style={{ marginTop: 2 }}
            >
              {result.initialMastery}% → {result.updatedMastery}% 📈
            </AppText>
          </View>
        </View>

        {/* Weak topics to review */}
        {result.weakTopics.length > 0 && (
          <View style={styles.weakBox}>
            <AppText variant="cardTitle" color={colors.error} weight="bold">
              পুনরায় অনুশীলনের পরামর্শ:
            </AppText>
            {result.weakTopics.map((topic, idx) => (
              <AppText
                key={idx}
                variant="bodySmall"
                color={colors.textPrimary}
                style={{ marginTop: 4 }}
              >
                • {topic}
              </AppText>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity activeOpacity={0.8} onPress={onRetryWeak} style={styles.primaryBtn}>
          <AppText variant="button" color={colors.white} weight="bold">
            ভুলগুলো আবার প্র্যাকটিস করো 🔄
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onGoHome} style={styles.secondaryBtn}>
          <AppText variant="button" color={colors.primary} weight="bold">
            হোমে ফিরে যাও 🏠
          </AppText>
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
  trophyContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  scoreCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  scoreBox: {
    alignItems: 'center',
  },
  masteryBanner: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  weakBox: {
    backgroundColor: colors.errorLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
});
